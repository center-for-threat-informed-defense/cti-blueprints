#!/usr/bin/env python3
"""MCP Server de CTI Publishing Tool: genera informes CTI (DOCX/PDF/HTML) para un LLM.

Expone como herramientas MCP las funciones de :mod:`cti_publishing_tool_v2`:

======================  =====================================================
Herramienta             Uso
======================  =====================================================
``list_report_types``   Tipos de informe disponibles.
``list_sections``       Secciones de un tipo de informe (para incluir/excluir).
``list_input_files``    JSON de datos y plantillas DOCX que el servidor puede leer.
``preview_report_html`` Renderiza el informe en HTML sin escribir archivos.
``generate_report``     Genera el documento DOCX, PDF o HTML.
``inspect_docx_template`` Analiza una plantilla DOCX corporativa.
``check_dependencies``  Plantillas, LibreOffice (PDF) y plantilla por defecto.
======================  =====================================================

Seguridad (el cliente es un LLM, que puede equivocarse o ser manipulado):

* Sólo se leen archivos dentro de los directorios permitidos
  (``CTI_MCP_DATA_DIRS`` para JSON, ``CTI_MCP_TEMPLATE_DIRS`` para plantillas).
  Las rutas se resuelven siguiendo enlaces simbólicos antes de comprobarlas,
  así que ``../`` o un enlace hacia fuera se rechazan.
* Sólo se escribe en ``CTI_MCP_OUTPUT_DIR``. El LLM elige el nombre del
  archivo, nunca el directorio; el nombre se sanea.
* Los datos enviados en línea tienen un tamaño máximo.
* Los errores conocidos se devuelven con un mensaje útil; los inesperados no
  exponen detalles internos (se registran en ``stderr``).
* Nada se escribe en ``stdout`` salvo el protocolo MCP (transporte stdio).

Configuración (variables de entorno; varias rutas separadas por ``os.pathsep``,
``:`` en Linux/macOS y ``;`` en Windows):

==========================  ==================================================
Variable                    Valor por defecto
==========================  ==================================================
``CTI_MCP_DATA_DIRS``       ``<proyecto>/data``
``CTI_MCP_TEMPLATE_DIRS``   Plantillas CTID: ``<proyecto>/cti-templates`` o
                            ``templates/`` de la raíz del repositorio
``CTI_MCP_OUTPUT_DIR``      ``<proyecto>/output``
``CTI_DOCX_TEMPLATE``       (sin plantilla) plantilla corporativa por defecto
``LIBREOFFICE_PATH``        (autodetección) ruta a ``soffice``
==========================  ==================================================

Uso::

    python cti_mcp_server.py                 # servidor MCP por stdio
    python cti_mcp_server.py --print-config  # muestra la configuración y sale

Registro en Claude Code::

    claude mcp add cti-publishing -- /ruta/create_report/bin/python /ruta/cti_mcp_server.py
"""

import argparse
import json
import logging
import os
import sys
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated, Any, Iterator, Literal, Mapping, Optional, Sequence

from pydantic import Field
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations

import cti_publishing_tool_v2 as tool
import document_converter as dc

__version__ = "1.0.0"

logger = logging.getLogger("cti_mcp_server")

SERVER_NAME = "cti-publishing"

ENV_DATA_DIRS = "CTI_MCP_DATA_DIRS"
ENV_TEMPLATE_DIRS = "CTI_MCP_TEMPLATE_DIRS"
ENV_OUTPUT_DIR = "CTI_MCP_OUTPUT_DIR"

#: Tamaño máximo (bytes) de ``report_data`` enviado en línea.
DEFAULT_MAX_INLINE_BYTES = 5 * 1024 * 1024
#: Caracteres máximos de HTML devueltos por ``preview_report_html``.
DEFAULT_MAX_PREVIEW_CHARS = 200_000
#: Máximo de archivos listados por directorio en ``list_input_files``.
MAX_LISTED_FILES = 500

DATA_SUFFIXES: tuple[str, ...] = (".json",)
TEMPLATE_SUFFIXES: tuple[str, ...] = tool.DOCX_TEMPLATE_SUFFIXES

SERVER_INSTRUCTIONS = """\
Genera informes de inteligencia de amenazas (CTI) en DOCX, PDF o HTML a partir de datos JSON
exportados por el CTI Authoring Tool, usando las plantillas del proyecto.

Flujo recomendado:
1. list_input_files: ver qué JSON de datos y plantillas DOCX corporativas hay disponibles.
2. list_report_types y list_sections: elegir el tipo de informe y las secciones.
3. preview_report_html (opcional): revisar el contenido sin crear archivos.
4. generate_report: crear el documento. Devuelve la ruta del archivo generado.

Los datos se pasan con data_file (un JSON listado por list_input_files) o con report_data
(un objeto con el mismo formato). Para PDF hace falta LibreOffice: si falta, el error incluye
los comandos de instalación; check_dependencies lo verifica de antemano.
"""

ReportKey = Literal["campaign", "executive", "ia", "ta"]
DocumentKind = Literal["docx", "pdf", "html"]
PdfEngineKind = Literal["auto", "libreoffice", "word"]


# --------------------------------------------------------------------------- #
# Configuración
# --------------------------------------------------------------------------- #
@dataclass(frozen=True)
class ServerConfig:
    """Configuración de seguridad y rutas del servidor.

    Attributes:
        data_dirs: Directorios desde los que se pueden leer JSON de datos.
        template_dirs: Directorios desde los que se pueden leer plantillas DOCX.
        output_dir: Único directorio donde se escriben los documentos.
        max_inline_bytes: Tamaño máximo de ``report_data`` en línea.
        max_preview_chars: Caracteres máximos de HTML en la vista previa.
    """

    data_dirs: tuple[Path, ...]
    template_dirs: tuple[Path, ...]
    output_dir: Path
    max_inline_bytes: int = DEFAULT_MAX_INLINE_BYTES
    max_preview_chars: int = DEFAULT_MAX_PREVIEW_CHARS

    @classmethod
    def from_env(cls, environ: Optional[Mapping[str, str]] = None) -> "ServerConfig":
        """Construye la configuración a partir de variables de entorno.

        Args:
            environ: Variables a usar; ``None`` usa ``os.environ``.

        Returns:
            Configuración con rutas absolutas resueltas.
        """
        env = os.environ if environ is None else environ

        def dirs(variable: str, default: Sequence[Path]) -> tuple[Path, ...]:
            value = env.get(variable, "")
            parts = [p for p in value.split(os.pathsep) if p.strip()] if value.strip() else list(default)
            return tuple(Path(p).expanduser().resolve() for p in parts)

        return cls(
            data_dirs=dirs(ENV_DATA_DIRS, [tool.BASE_DIR / "data"]),
            template_dirs=dirs(ENV_TEMPLATE_DIRS, [tool.CTID_TEMPLATES_DIR]),
            output_dir=Path(env.get(ENV_OUTPUT_DIR) or tool.DEFAULT_OUTPUT_DIR).expanduser().resolve(),
        )

    def to_dict(self) -> dict[str, Any]:
        """Devuelve la configuración como ``dict`` serializable a JSON."""
        return {
            "data_dirs": [str(p) for p in self.data_dirs],
            "template_dirs": [str(p) for p in self.template_dirs],
            "output_dir": str(self.output_dir),
            "max_inline_bytes": self.max_inline_bytes,
            "max_preview_chars": self.max_preview_chars,
        }


# --------------------------------------------------------------------------- #
# Utilidades de seguridad y errores
# --------------------------------------------------------------------------- #
def resolve_allowed_file(value: str, roots: Sequence[Path], suffixes: Sequence[str], kind: str) -> Path:
    """Resuelve una ruta pedida por el cliente y comprueba que esté permitida.

    Las rutas relativas se buscan en cada directorio permitido, en orden. La
    ruta se resuelve (siguiendo enlaces simbólicos) antes de comprobar que
    quede dentro de un directorio permitido, por lo que ``../`` y los enlaces
    hacia fuera se rechazan.

    Args:
        value: Ruta indicada por el cliente (relativa o absoluta).
        roots: Directorios permitidos (ya resueltos).
        suffixes: Extensiones admitidas (en minúsculas).
        kind: Nombre del tipo de archivo para los mensajes de error.

    Returns:
        Ruta absoluta validada.

    Raises:
        ToolError: Si la ruta está vacía, sale de los directorios permitidos,
            no existe, no es un archivo o tiene otra extensión.
    """
    text = (value or "").strip().strip("'\"")
    if not text or "\x00" in text:
        raise ToolError(f"Invalid {kind} path.")
    raw = Path(text).expanduser()
    if raw.suffix.lower() not in suffixes:
        raise ToolError(f"{kind} must have extension {', '.join(suffixes)}: {text}")
    candidates = [raw] if raw.is_absolute() else [root / raw for root in roots]
    for candidate in candidates:
        resolved = candidate.resolve()
        if not any(resolved.is_relative_to(root) for root in roots):
            raise ToolError(f"{kind} is outside the allowed directories: {text}")
        if resolved.is_file():
            return resolved
    raise ToolError(f"{kind} not found in the allowed directories: {text}. "
                    "Use list_input_files to see the available files.")


def _relative_name(path: Path, roots: Sequence[Path]) -> str:
    """Nombre de un archivo relativo a su directorio permitido (para mostrar al LLM).

    Args:
        path: Ruta absoluta.
        roots: Directorios permitidos.

    Returns:
        Ruta relativa al primer directorio que la contiene, o la ruta absoluta.
    """
    for root in roots:
        if path.is_relative_to(root):
            return path.relative_to(root).as_posix()
    return str(path)


def _list_files(roots: Sequence[Path], suffixes: Sequence[str]) -> list[dict[str, Any]]:
    """Lista los archivos con las extensiones indicadas en los directorios permitidos.

    Se omiten archivos y carpetas ocultos, los temporales de Word (``~$``) y
    los enlaces que apuntan fuera de los directorios permitidos.

    Args:
        roots: Directorios permitidos.
        suffixes: Extensiones admitidas.

    Returns:
        Lista de ``{"name", "directory", "size_bytes"}`` (máximo
        :data:`MAX_LISTED_FILES` por directorio).
    """
    files: list[dict[str, Any]] = []
    for root in roots:
        if not root.is_dir():
            continue
        count = 0
        for path in sorted(root.rglob("*")):
            relative = path.relative_to(root)
            if any(part.startswith((".", "~$")) for part in relative.parts):
                continue
            if path.suffix.lower() not in suffixes or not path.is_file():
                continue
            if not path.resolve().is_relative_to(root):
                continue
            files.append({"name": relative.as_posix(), "directory": str(root),
                          "size_bytes": path.stat().st_size})
            count += 1
            if count >= MAX_LISTED_FILES:
                break
    return files


@contextmanager
def tool_errors() -> Iterator[None]:
    """Convierte los errores conocidos en ``ToolError`` con un mensaje útil para el LLM.

    Los errores inesperados no se convierten: el SDK de MCP los devuelve sin
    detalles internos y registra el *traceback* en ``stderr``.
    """
    try:
        yield
    except ToolError:
        raise
    except (tool.CTIPublishingError, dc.ConversionError, ValueError) as exc:
        raise ToolError(str(exc)) from exc


def _check_inline_data(report_data: Optional[dict[str, Any]], max_bytes: int) -> None:
    """Valida el tamaño de los datos enviados en línea.

    Args:
        report_data: Datos del informe o ``None``.
        max_bytes: Tamaño máximo serializado.

    Raises:
        ToolError: Si los datos superan el tamaño máximo.
    """
    if report_data is None:
        return
    size = len(json.dumps(report_data, ensure_ascii=False).encode("utf-8"))
    if size > max_bytes:
        raise ToolError(f"report_data is too large ({size} bytes; maximum {max_bytes}).")


def _resolve_data(config: ServerConfig, data_file: Optional[str],
                  report_data: Optional[dict[str, Any]]) -> tuple[Optional[Path], Optional[dict[str, Any]]]:
    """Valida que se indique exactamente una fuente de datos y la resuelve.

    Args:
        config: Configuración del servidor.
        data_file: Ruta a un JSON permitido, o ``None``.
        report_data: Datos en línea, o ``None``.

    Returns:
        Tupla ``(ruta_validada, datos_en_linea)``; uno de los dos es ``None``.

    Raises:
        ToolError: Si no hay fuente, hay dos, o la fuente no es válida.
    """
    if (data_file is None) == (report_data is None):
        raise ToolError("Provide exactly one of data_file or report_data.")
    if data_file is not None:
        return resolve_allowed_file(data_file, config.data_dirs, DATA_SUFFIXES, "data_file"), None
    _check_inline_data(report_data, config.max_inline_bytes)
    return None, report_data


# --------------------------------------------------------------------------- #
# Servidor
# --------------------------------------------------------------------------- #
_READ_ONLY = ToolAnnotations(read_only_hint=True, destructive_hint=False, idempotent_hint=True,
                             open_world_hint=False)

ReportTypeParam = Annotated[ReportKey, Field(
    description="Tipo de informe: campaign (Campaign Report), executive (Executive Report), "
                "ia (Intrusion Analysis Report) o ta (Threat Actor Report).")]
DataFileParam = Annotated[Optional[str], Field(
    description="JSON de datos: nombre relativo tal como lo devuelve list_input_files "
                "(p. ej. 'An Example Campaign Report.json'). Excluyente con report_data.")]
ReportDataParam = Annotated[Optional[dict[str, Any]], Field(
    description="Datos del informe en línea, con el mismo formato que los JSON del CTI "
                "Authoring Tool. Excluyente con data_file.")]
ExcludeParam = Annotated[Optional[list[str]], Field(
    description="Secciones a omitir (nombres de list_sections). Excluyente con only_sections.")]
OnlyParam = Annotated[Optional[list[str]], Field(
    description="Únicas secciones a incluir (nombres de list_sections); encabezado, "
                "introducción, feedback y pie se incluyen siempre. Excluyente con exclude_sections.")]


def create_server(config: Optional[ServerConfig] = None) -> MCPServer:
    """Crea el servidor MCP con sus herramientas.

    Args:
        config: Configuración; ``None`` la lee de las variables de entorno.

    Returns:
        Instancia de ``MCPServer`` lista para ``run()`` o para un cliente en
        memoria (tests).
    """
    config = config or ServerConfig.from_env()
    server = MCPServer(SERVER_NAME, title="CTI Publishing Tool", version=__version__,
                       instructions=SERVER_INSTRUCTIONS, log_level="WARNING")

    @server.tool(title="Tipos de informe", annotations=_READ_ONLY)
    def list_report_types() -> list[dict[str, Any]]:
        """Lista los tipos de informe CTI disponibles con su clave, nombre y secciones."""
        return tool.list_report_types()

    @server.tool(title="Secciones de un informe", annotations=_READ_ONLY)
    def list_sections(report_type: ReportTypeParam) -> list[dict[str, Any]]:
        """Lista las secciones de un tipo de informe en orden de aparición.

        Las secciones con selectable=true pueden usarse en exclude_sections u only_sections.
        """
        with tool_errors():
            return tool.list_sections(report_type)

    @server.tool(title="Archivos disponibles", annotations=_READ_ONLY)
    def list_input_files() -> dict[str, Any]:
        """Lista los JSON de datos y las plantillas DOCX corporativas que el servidor puede leer.

        Usa el campo name de cada archivo como data_file o docx_template. También indica el
        directorio donde se guardan los documentos y la plantilla corporativa por defecto.
        """
        default_template = None
        with tool_errors():
            resolved = tool.resolve_docx_template(None)
            default_template = str(resolved) if resolved else None
        return {
            "data_files": _list_files(config.data_dirs, DATA_SUFFIXES),
            "docx_templates": _list_files(config.template_dirs, TEMPLATE_SUFFIXES),
            "output_dir": str(config.output_dir),
            "default_docx_template": default_template,
        }

    @server.tool(title="Vista previa HTML", annotations=_READ_ONLY)
    def preview_report_html(
        report_type: ReportTypeParam,
        data_file: DataFileParam = None,
        report_data: ReportDataParam = None,
        exclude_sections: ExcludeParam = None,
        only_sections: OnlyParam = None,
        max_chars: Annotated[int, Field(ge=1000, le=DEFAULT_MAX_PREVIEW_CHARS,
                                        description="Máximo de caracteres de HTML a devolver.")] = 50_000,
    ) -> dict[str, Any]:
        """Renderiza el informe en HTML sin crear archivos, para revisar su contenido.

        Devuelve html (posiblemente truncado), truncated, total_chars, sections y excluded_sections.
        """
        path, inline = _resolve_data(config, data_file, report_data)
        with tool_errors():
            excluded = tool.resolve_exclusions(report_type, exclude_sections, only_sections, strict=True)
            data = inline if inline is not None else tool.load_report_data(path)
            html = tool.render_report_html(data, report_type, excluded)
        limit = min(max_chars, config.max_preview_chars)
        return {
            "html": html[:limit],
            "truncated": len(html) > limit,
            "total_chars": len(html),
            "sections": tool.compose_sections(report_type, excluded),
            "excluded_sections": excluded,
        }

    @server.tool(title="Generar informe", annotations=ToolAnnotations(
        read_only_hint=False, destructive_hint=True, idempotent_hint=True, open_world_hint=False))
    def generate_report(
        report_type: ReportTypeParam,
        document_type: Annotated[DocumentKind, Field(description="Formato de salida.")] = "docx",
        data_file: DataFileParam = None,
        report_data: ReportDataParam = None,
        exclude_sections: ExcludeParam = None,
        only_sections: OnlyParam = None,
        docx_template: Annotated[Optional[str], Field(
            description="Plantilla DOCX/DOTX corporativa (nombre de list_input_files). Si se "
                        "omite se usa la plantilla por defecto del servidor, si existe. "
                        "No aplica a HTML.")] = None,
        table_style: Annotated[Optional[str], Field(
            description="Estilo de tabla de Word (p. ej. uno corporativo de la plantilla).")] = None,
        keep_template_content: Annotated[bool, Field(
            description="Conservar el contenido de la plantilla y añadir el informe al final.")] = False,
        output_name: Annotated[Optional[str], Field(
            max_length=150,
            description="Nombre del archivo sin extensión. Por defecto, el nombre del JSON o el "
                        "título del informe. Si ya existe, se sobrescribe.")] = None,
        pdf_engine: Annotated[PdfEngineKind, Field(
            description="Motor PDF: auto (LibreOffice; Word en Windows/macOS si falta), "
                        "libreoffice o word.")] = "auto",
        watermark: Annotated[Optional[str], Field(
            max_length=tool.WATERMARK_MAX_CHARS,
            description="Marca de agua: palabra o frase libre que se muestra en diagonal en todas "
                        "las páginas, p. ej. 'CONFIDENCIAL', 'BORRADOR' o 'USO INTERNO'. Se omite "
                        "= sin marca de agua.")] = None,
        watermark_color: Annotated[Optional[str], Field(
            pattern=r"^#?[0-9A-Fa-f]{6}$",
            description="Color hexadecimal RRGGBB de la marca de agua. Por defecto C0C0C0 "
                        "(gris claro).")] = None,
    ) -> dict[str, Any]:
        """Genera el informe CTI en DOCX, PDF o HTML y lo guarda en el directorio de salida.

        Devuelve output_path (ruta del archivo creado), las secciones incluidas y excluidas, la
        plantilla usada, los estilos que la plantilla no definía, la marca de agua aplicada y
        page_numbers. La numeración de páginas es automática: added (añadida al pie),
        template (ya la traía la plantilla) o not_applicable (HTML). Para PDF hace falta LibreOffice; si falta, el error incluye los
        comandos de instalación.
        """
        path, inline = _resolve_data(config, data_file, report_data)
        template = (resolve_allowed_file(docx_template, config.template_dirs, TEMPLATE_SUFFIXES,
                                         "docx_template") if docx_template else None)
        with tool_errors():
            result = tool.generate_report(
                path, report_type, document_type,
                exclude_sections=exclude_sections, only_sections=only_sections,
                output_dir=config.output_dir, pdf_engine=pdf_engine, strict_sections=True,
                docx_template=template, table_style=table_style,
                keep_template_content=keep_template_content,
                report_data=inline, output_name=output_name,
                watermark=watermark, watermark_color=watermark_color)
        if not Path(result["output_path"]).resolve().is_relative_to(config.output_dir):
            raise ToolError("Refusing to report a file outside the output directory.")  # defensa en profundidad
        return result

    @server.tool(title="Analizar plantilla DOCX", annotations=_READ_ONLY)
    def inspect_docx_template(
        template: Annotated[str, Field(description="Plantilla DOCX/DOTX (nombre de list_input_files).")],
    ) -> dict[str, Any]:
        """Analiza una plantilla DOCX corporativa: qué se conserva y qué estilos le faltan.

        Informa encabezado, pie, logos, márgenes, fuente, estilos de tabla, si tiene el marcador
        {{report_content}} y advertencias para adaptarla.
        """
        path = resolve_allowed_file(template, config.template_dirs, TEMPLATE_SUFFIXES, "template")
        with tool_errors():
            return tool.inspect_docx_template(path)

    @server.tool(title="Verificar dependencias", annotations=_READ_ONLY)
    def check_dependencies() -> dict[str, Any]:
        """Verifica las plantillas del proyecto, LibreOffice (necesario para PDF) y la plantilla por defecto.

        Si falta LibreOffice, install_message incluye los comandos de instalación para este sistema.
        """
        result = tool.check_dependencies()
        result["server"] = config.to_dict()
        return result

    return server


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Punto de entrada: inicia el servidor MCP por stdio.

    Args:
        argv: Argumentos sin el nombre del programa; ``None`` usa ``sys.argv``.

    Returns:
        Código de salida (0 si termina correctamente).
    """
    parser = argparse.ArgumentParser(description="CTI Publishing Tool MCP Server (stdio).")
    parser.add_argument("--print-config", action="store_true",
                        help="Print the effective configuration as JSON and exit.")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    args = parser.parse_args(argv)

    # stdout es el canal del protocolo: todo el registro va a stderr.
    logging.basicConfig(level=logging.WARNING, format="%(name)s %(levelname)s: %(message)s",
                        stream=sys.stderr)
    config = ServerConfig.from_env()
    if args.print_config:
        print(json.dumps(config.to_dict(), indent=2, ensure_ascii=False))
        return 0
    create_server(config).run("stdio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
