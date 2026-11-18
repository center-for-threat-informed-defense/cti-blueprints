#!/usr/bin/env python3
"""CTI Publishing Tool v2: genera informes CTI en DOCX, PDF o HTML a partir de JSON.

Convierte los JSON exportados por el *CTI Authoring Tool* en documentos para
distribución, usando las plantillas Liquid de ``templates/sections``. Es la
versión corregida de ``cti_publishing_tool.py`` (el original se conserva en
``cti_publishing_tool.py.bak``) y mantiene su esencia: los mismos tipos de
informe, las mismas plantillas, los mismos argumentos de línea de comandos
(``-r``, ``-f``, ``-e``, ``-o``, ``-d``) y la misma CLI guiada.

Tipos de informe:

====  ======================  ==========================
Code  Clave                   Nombre
====  ======================  ==========================
1     ``campaign``            Campaign Report
2     ``executive``           Executive Report
3     ``ia``                  Intrusion Analysis Report
4     ``ta``                  Threat Actor Report
====  ======================  ==========================

Correcciones respecto de la versión original:

* Rutas de plantillas y de salida absolutas (relativas a este archivo): el
  script funciona desde cualquier directorio de trabajo.
* Conversión a PDF multiplataforma (Linux/Windows/macOS) mediante
  :mod:`document_converter` (LibreOffice headless, con respaldo en Word). Si
  falta LibreOffice se emite una alerta con los comandos de instalación según
  el sistema operativo y la distribución.
* Las secciones se definen en un único lugar (:data:`REPORT_TYPES`). Se
  corrigen la tabla MITRE del informe IA (``mitre_attack_table`` →
  ``mitre_attack_table_ia``) y la sección ``metadata``, que antes nunca se
  renderizaba.
* Rutas arrastradas a la terminal: se des-escapan los espacios (``\\ ``) en
  lugar de eliminarlos (además se elimina el ``SyntaxWarning``).
* Los filtros ``newline_to_br`` / ``strip_newline`` aceptan saltos de línea
  reales y el literal ``\\n``, y no imprimen ``None`` para valores nulos.
* Validación de argumentos: si faltan ``-r`` o ``-f`` se piden sólo los datos
  faltantes en la CLI guiada (o se informa del error con ``--no_interactive``
  o sin terminal interactiva) en lugar de terminar con un *traceback*.
* El filtro del aviso de BeautifulSoup funciona (por categoría).
* ``export_report`` devuelve la ruta del archivo creado y valida el tipo de
  documento.
* ``_embed_file`` sanea el nombre de archivo (evita *path traversal*).

Plantillas DOCX corporativas (``--docx_template`` o variable ``CTI_DOCX_TEMPLATE``):

* Se acepta un ``.docx`` o ``.dotx`` en blanco con la identidad de la empresa.
  Se conservan encabezado, pie, logos, márgenes, tamaño de página, fuentes,
  tema de colores y estilos; las tablas usan los colores del tema.
* Si la plantilla no define algún estilo que el informe necesita (títulos,
  listas, tabla), se copia el de Word por defecto (con su numeración
  renumerada) y se avisa, para poder definirlo en la plantilla una sola vez.
* Si el cuerpo contiene un párrafo ``{{report_content}}``, el informe se
  inserta ahí y se conserva el resto (portada, aviso legal, contraportada).
  Si no, el cuerpo se vacía (o se conserva con ``--keep_template_content``).
* ``--inspect_template`` analiza una plantilla y lista lo que se conserva y
  lo que falta.

Marca de agua y numeración de páginas (DOCX y PDF; la marca de agua también en HTML):

* ``--watermark "CONFIDENCIAL"`` añade la palabra o frase indicada en
  diagonal, semitransparente y detrás del contenido en todas las páginas
  (``--watermark_color`` RRGGBB, por defecto gris claro).
* La numeración de páginas es automática, sin opciones: se añade al pie
  (*Page 1 of N*) si el documento no la tiene y, si la plantilla ya numera
  las páginas, se respeta.

Diseño orientado a un futuro MCP Server:

* La lógica está separada de la interacción: las funciones públicas
  (:func:`list_report_types`, :func:`list_sections`, :func:`render_report_html`,
  :func:`generate_report`, :func:`check_dependencies`...) no usan ``input()``
  ni ``print()``, tienen *type hints* y devuelven datos serializables a JSON.
* Los errores se señalan con excepciones propias derivadas de
  :class:`CTIPublishingError`.
* Los mensajes de diagnóstico van por ``logging`` (``stderr``), nunca por
  ``stdout``, compatible con el transporte stdio de MCP.

Uso::

    python cti_publishing_tool_v2.py                       # CLI guiada
    python cti_publishing_tool_v2.py -r 1 -f "data/An Example Campaign Report.json"
    python cti_publishing_tool_v2.py -r 3 -f datos.json -o key_points mitre_attack_table -d pdf
    python cti_publishing_tool_v2.py --check_dependencies
    python cti_publishing_tool_v2.py -r 1 -f datos.json -d pdf --docx_template corporativo.dotx
    python cti_publishing_tool_v2.py --inspect_template corporativo.dotx
    python cti_publishing_tool_v2.py -r 4 -f datos.json -d pdf --watermark "CONFIDENCIAL"
"""

from __future__ import annotations

import argparse
import base64
import binascii
import copy
import io
import json
import logging
import os
import re
import secrets
import sys
import tempfile
import warnings
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable, Literal, Optional, Sequence
from urllib.parse import unquote, urlparse

import docx
from docx.document import Document as DocxDocument
from docx.enum.style import WD_STYLE_TYPE
from docx.opc.constants import CONTENT_TYPE as CT, RELATIONSHIP_TYPE as RT
from docx.opc.packuri import PackURI
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.parts.numbering import NumberingPart
from docx.shared import Pt, Twips
from liquid import Environment, FileSystemLoader
from htmldocx import HtmlToDocx

import document_converter as dc

__version__ = "2.0.0"

logger = logging.getLogger("cti_publishing_tool")

# Silencia el aviso de BeautifulSoup (lo dispara htmldocx) cuando un texto parece
# una URL. El filtro original por mensaje no coincidía con el texto real del aviso.
try:
    from bs4 import MarkupResemblesLocatorWarning as _BS4_URL_WARNING

    warnings.filterwarnings("ignore", category=_BS4_URL_WARNING)
except ImportError:  # pragma: no cover - bs4 es dependencia de htmldocx
    _BS4_URL_WARNING = None
warnings.filterwarnings("ignore", message=r".*looks (more )?like a URL.*")

# --------------------------------------------------------------------------- #
# Configuración
# --------------------------------------------------------------------------- #
#: Directorio del proyecto (donde reside este script).
BASE_DIR: Path = Path(__file__).resolve().parent
#: Directorio de plantillas Liquid de las secciones.
TEMPLATES_DIR: Path = BASE_DIR / "templates" / "sections"
#: Directorio de salida por defecto.
DEFAULT_OUTPUT_DIR: Path = BASE_DIR / "output"


def _find_ctid_templates_dir(base_dir: Path) -> Path:
    """Localiza las plantillas DOCX oficiales CTID.

    En el paquete de distribución están en ``cti-templates/`` junto al script;
    en el repositorio de código fuente (``src/cti_publishing_tool``), en
    ``templates/`` de la raíz del repositorio. Si no se encuentran, devuelve
    ``cti-templates/`` (puede no existir).
    """
    candidates = (base_dir / "cti-templates", base_dir.parent.parent / "templates")
    for candidate in candidates:
        if candidate.is_dir() and any(candidate.glob("CTID-*.docx")):
            return candidate
    return candidates[0]


#: Plantillas DOCX oficiales CTID (ver :func:`_find_ctid_templates_dir`).
CTID_TEMPLATES_DIR: Path = _find_ctid_templates_dir(BASE_DIR)
#: Estilo de tabla aplicado en los documentos DOCX.
DOCX_TABLE_STYLE = "Light List Accent 1"

#: Formatos de documento admitidos.
DocumentType = Literal["docx", "pdf", "html"]
DOCUMENT_TYPES: tuple[str, ...] = ("docx", "pdf", "html")

# Mapa global usado para construir las plantillas HTML dinámicas.
# { clave de sección (nombre usado en `exclude_sections`): archivo de plantilla }
SECTIONS: dict[str, str] = {
    "header": "report_header.html",
    "intro": "report_intro.html",
    "executive_summary": "executive_summary.html",
    "key_points": "key_points.html",
    "assessment": "assessment.html",
    "indicator_analysis": "indicator_analysis.html",
    "outlook": "outlook.html",
    "threat_actor": "threat_actor.html",
    "intelligence_gaps": "intelligence_gaps.html",
    "mitre_attack_table": "mitre_attack_table.html",
    "mitre_attack_table_ia": "mitre_attack_table_ia.html",
    "victims": "victims.html",
    "timeline": "timeline.html",
    "iocs": "iocs.html",
    "signatures": "signatures.html",
    # 'TORENAMELATER': 'TORENAMELATER.html'  -> marcador pendiente del original; el
    # archivo existente es TORENAME.html (matriz de probabilidad). No se usa.
    "intelligence_requirements": "intelligence_requirements.html",
    "feedback": "feedback.html",
    "data_sources": "data_sources.html",
    "metadata": "metadata_generic.html",
    "metadata_ia": "metadata_ia.html",
    "footer": "report_footer.html",
}

#: Nombres legibles de las secciones (menús de la CLI y respuestas MCP).
SECTION_LABELS: dict[str, str] = {
    "header": "Header",
    "intro": "Introduction",
    "executive_summary": "Executive Summary",
    "key_points": "Key Points",
    "assessment": "Assessment",
    "indicator_analysis": "Indicator Analysis",
    "outlook": "Outlook",
    "threat_actor": "Threat Actor",
    "intelligence_gaps": "Intelligence Gaps",
    "mitre_attack_table": "MITRE ATT&CK Table",
    "mitre_attack_table_ia": "MITRE ATT&CK Table",
    "victims": "Victims",
    "timeline": "Timeline",
    "iocs": "IOCs",
    "signatures": "Signatures",
    "intelligence_requirements": "Intelligence Requirements",
    "feedback": "Feedback",
    "data_sources": "Data Sources",
    "metadata": "Metadata",
    "metadata_ia": "Metadata",
    "footer": "Footer",
}

#: Secciones que siempre se incluyen y no pueden excluirse desde la CLI.
FIXED_SECTIONS: tuple[str, ...] = ("header", "intro", "feedback", "footer")


@dataclass(frozen=True)
class ReportType:
    """Definición de un tipo de informe.

    Attributes:
        code: Código numérico usado por la CLI (``"1"`` a ``"4"``).
        key: Clave interna (``"campaign"``, ``"executive"``, ``"ia"``, ``"ta"``).
        label: Nombre legible del informe.
        body_sections: Secciones del cuerpo en orden de renderizado (sin
            ``header``, ``intro`` ni ``footer``).
    """

    code: str
    key: str
    label: str
    body_sections: tuple[str, ...]

    @property
    def selectable_sections(self) -> tuple[str, ...]:
        """Secciones que el usuario puede incluir o excluir (sin las fijas)."""
        return tuple(s for s in self.body_sections if s not in FIXED_SECTIONS)

    def to_dict(self) -> dict[str, Any]:
        """Devuelve el tipo de informe como ``dict`` serializable a JSON."""
        return {
            "code": self.code,
            "key": self.key,
            "label": self.label,
            "sections": list(self.body_sections),
            "selectable_sections": list(self.selectable_sections),
        }


#: Única fuente de verdad de los tipos de informe y sus secciones (en orden).
REPORT_TYPES: dict[str, ReportType] = {
    rt.key: rt
    for rt in (
        ReportType("1", "campaign", "Campaign Report", (
            "executive_summary", "key_points", "assessment", "intelligence_gaps",
            "mitre_attack_table", "timeline", "iocs", "signatures",
            "intelligence_requirements", "feedback", "data_sources", "metadata")),
        ReportType("2", "executive", "Executive Report", (
            "executive_summary", "key_points", "assessment", "outlook",
            "intelligence_gaps", "intelligence_requirements", "feedback", "data_sources")),
        ReportType("3", "ia", "Intrusion Analysis Report", (
            "executive_summary", "key_points", "indicator_analysis",
            "mitre_attack_table_ia", "iocs", "signatures", "intelligence_requirements",
            "feedback", "data_sources", "metadata_ia")),
        ReportType("4", "ta", "Threat Actor Report", (
            "executive_summary", "key_points", "assessment", "threat_actor", "timeline",
            "intelligence_gaps", "mitre_attack_table", "victims", "iocs", "signatures",
            "intelligence_requirements", "feedback", "data_sources", "metadata")),
    )
}

#: Alias aceptados para identificar un tipo de informe.
_REPORT_TYPE_ALIASES: dict[str, str] = {
    "1": "campaign", "campaign": "campaign",
    "2": "executive", "executive": "executive",
    "3": "ia", "ia": "ia", "intrusion_analysis": "ia", "intrusion analysis": "ia",
    "4": "ta", "ta": "ta", "threat_actor": "ta", "threat actor": "ta",
}

#: Nombres de sección aceptados por la CLI (``-e`` / ``-o``).
CLI_SECTION_CHOICES: tuple[str, ...] = (
    "executive_summary", "key_points", "assessment", "indicator_analysis", "outlook",
    "threat_actor", "intelligence_gaps", "mitre_attack_table", "victims", "timeline",
    "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata",
    "mitre_attack_table_ia", "metadata_ia",
)


# --------------------------------------------------------------------------- #
# Excepciones
# --------------------------------------------------------------------------- #
class CTIPublishingError(Exception):
    """Excepción base de la herramienta; todas las demás derivan de ella."""


class InvalidReportTypeError(CTIPublishingError, ValueError):
    """El tipo de informe indicado no existe."""


class InvalidSectionError(CTIPublishingError, ValueError):
    """Una o más secciones no son válidas para el tipo de informe (modo estricto)."""


class DataFileError(CTIPublishingError):
    """El archivo de datos JSON no existe, no es ``.json`` o no es válido."""


class ExportError(CTIPublishingError):
    """No se pudo exportar el documento (formato inválido o fallo de conversión)."""


class PdfEngineUnavailableError(ExportError):
    """No hay motor PDF disponible; el mensaje incluye cómo instalar LibreOffice."""


# --------------------------------------------------------------------------- #
# Entorno Liquid y filtros
# --------------------------------------------------------------------------- #
#: Saltos de línea reales (CRLF, CR, LF) y sus versiones literales escapadas.
_NEWLINE_RE = re.compile(r"\r\n|\r|\n|\\r\\n|\\n")


def newline_to_br(val: Any) -> str:
    """Filtro Liquid: convierte saltos de línea en ``<br>``.

    Acepta tanto saltos de línea reales (``"\\n"`` en JSON) como el literal de
    dos caracteres barra + n (``"\\\\n"`` en JSON), ya que los datos de origen
    usan ambas formas.

    Args:
        val: Valor de la plantilla (cadena, número, ``None``...).

    Returns:
        Texto con ``<br>`` en lugar de saltos de línea; ``""`` si ``val`` es ``None``.
    """
    if val is None:
        return ""
    return _NEWLINE_RE.sub("<br>", str(val))


def strip_newline(val: Any) -> str:
    """Filtro Liquid: elimina los saltos de línea (reales y literales ``\\n``).

    Args:
        val: Valor de la plantilla.

    Returns:
        Texto sin saltos de línea; ``""`` si ``val`` es ``None``.
    """
    if val is None:
        return ""
    return _NEWLINE_RE.sub("", str(val))


def create_environment(templates_dir: str | os.PathLike = TEMPLATES_DIR) -> Environment:
    """Crea el entorno Liquid con el cargador de plantillas y los filtros propios.

    Args:
        templates_dir: Directorio de plantillas de secciones.

    Returns:
        Entorno Liquid configurado con ``newline_to_br`` y ``strip_newline``.
    """
    environment = Environment(loader=FileSystemLoader(str(templates_dir)))
    environment.add_filter("newline_to_br", newline_to_br)
    environment.add_filter("strip_newline", strip_newline)
    return environment


#: Entorno Liquid por defecto (mismo nombre que en la versión original).
env: Environment = create_environment()


# --------------------------------------------------------------------------- #
# Tipos de informe y secciones
# --------------------------------------------------------------------------- #
def get_report_type(report_type: str | int | ReportType) -> ReportType:
    """Normaliza y devuelve la definición de un tipo de informe.

    Args:
        report_type: Código (``1``-``4`` como ``int`` o ``str``), clave
            (``"campaign"``, ``"executive"``, ``"ia"``, ``"ta"``), alias
            (``"intrusion_analysis"``, ``"threat_actor"``) o un
            :class:`ReportType`.

    Returns:
        El :class:`ReportType` correspondiente.

    Raises:
        InvalidReportTypeError: Si el valor no corresponde a ningún tipo.
    """
    if isinstance(report_type, ReportType):
        return report_type
    key = _REPORT_TYPE_ALIASES.get(str(report_type).strip().lower())
    if key is None:
        valid = ", ".join(f"{rt.code}/{rt.key}" for rt in REPORT_TYPES.values())
        raise InvalidReportTypeError(f"Tipo de informe no válido: {report_type!r}. Opciones: {valid}")
    return REPORT_TYPES[key]


def list_report_types() -> list[dict[str, Any]]:
    """Lista los tipos de informe disponibles.

    Pensada como herramienta MCP de descubrimiento.

    Returns:
        Lista de diccionarios con ``code``, ``key``, ``label``, ``sections`` y
        ``selectable_sections`` de cada tipo.
    """
    return [rt.to_dict() for rt in REPORT_TYPES.values()]


def resolve_section_name(report_type: str | int | ReportType, name: str) -> Optional[str]:
    """Traduce un nombre de sección al nombre interno válido para un informe.

    Admite los nombres genéricos de la CLI: en el informe IA,
    ``mitre_attack_table`` y ``metadata`` se traducen a
    ``mitre_attack_table_ia`` y ``metadata_ia`` (y viceversa en el resto).

    Args:
        report_type: Tipo de informe (ver :func:`get_report_type`).
        name: Nombre de sección indicado por el usuario.

    Returns:
        Nombre interno de la sección, o ``None`` si no existe en ese informe.
    """
    rt = get_report_type(report_type)
    candidate = str(name).strip().lower()
    for option in (candidate, f"{candidate}_ia", candidate.removesuffix("_ia")):
        if option in rt.body_sections:
            return option
    return None


def list_sections(report_type: str | int | ReportType) -> list[dict[str, Any]]:
    """Lista las secciones de un tipo de informe, en orden de renderizado.

    Pensada como herramienta MCP de descubrimiento.

    Args:
        report_type: Tipo de informe (ver :func:`get_report_type`).

    Returns:
        Lista de diccionarios con ``name`` (nombre interno), ``label``,
        ``template`` y ``selectable`` (``False`` para las secciones fijas).
    """
    rt = get_report_type(report_type)
    names = ["header", "intro", *rt.body_sections, "footer"]
    return [
        {
            "name": name,
            "label": SECTION_LABELS.get(name, name),
            "template": SECTIONS[name],
            "selectable": name not in FIXED_SECTIONS,
        }
        for name in names
    ]


def resolve_exclusions(
    report_type: str | int | ReportType,
    exclude_sections: Optional[Iterable[str]] = None,
    only_sections: Optional[Iterable[str]] = None,
    strict: bool = False,
) -> list[str]:
    """Calcula la lista de secciones a excluir de un informe.

    Reproduce la lógica original de ``-e`` (excluir) y ``-o`` (sólo incluir):
    con ``only_sections``, se excluyen todas las secciones seleccionables que
    no figuren en la lista. Los nombres no válidos para el informe se ignoran
    (comportamiento original) salvo que ``strict`` sea ``True``.

    Args:
        report_type: Tipo de informe (ver :func:`get_report_type`).
        exclude_sections: Secciones a excluir.
        only_sections: Únicas secciones seleccionables a incluir. Excluyente
            con ``exclude_sections``.
        strict: Si es ``True`` lanza error ante secciones no válidas.

    Returns:
        Secciones a excluir (nombres internos), en orden de renderizado.

    Raises:
        ValueError: Si se indican ``exclude_sections`` y ``only_sections`` a la vez.
        InvalidSectionError: Con ``strict=True`` y alguna sección no válida.
    """
    rt = get_report_type(report_type)
    exclude_list = [s for s in (exclude_sections or []) if s]
    only_list = [s for s in (only_sections or []) if s]
    if exclude_list and only_list:
        raise ValueError("exclude_sections y only_sections son mutuamente excluyentes.")

    requested = only_list or exclude_list
    resolved = {resolve_section_name(rt, s) for s in requested}
    invalid = [s for s in requested if resolve_section_name(rt, s) is None]
    resolved.discard(None)
    if invalid:
        if strict:
            raise InvalidSectionError(
                f"Secciones no válidas para {rt.label}: {', '.join(invalid)}. "
                f"Válidas: {', '.join(rt.selectable_sections)}")
        logger.info("Secciones ignoradas (no aplican a %s): %s", rt.label, ", ".join(invalid))

    if only_list:
        return [s for s in rt.selectable_sections if s not in resolved]
    return [s for s in rt.body_sections if s in resolved]


def compose_sections(
    report_type: str | int | ReportType,
    exclude_sections: Optional[Iterable[str]] = None,
) -> list[str]:
    """Devuelve la lista ordenada de secciones a renderizar.

    ``header``, ``intro`` y ``footer`` siempre se incluyen porque abren y
    cierran el documento HTML. Las claves no válidas se ignoran.

    Args:
        report_type: Tipo de informe (ver :func:`get_report_type`).
        exclude_sections: Secciones a excluir (nombres internos o genéricos).

    Returns:
        Nombres internos de las secciones, en orden.
    """
    rt = get_report_type(report_type)
    excluded = {resolve_section_name(rt, s) for s in (exclude_sections or [])}
    return ["header", "intro", *(s for s in rt.body_sections if s not in excluded), "footer"]


# --------------------------------------------------------------------------- #
# Datos de entrada
# --------------------------------------------------------------------------- #
def clean_input_path(raw: str, posix: Optional[bool] = None) -> Path:
    """Limpia una ruta escrita o arrastrada a la terminal.

    * Elimina espacios y comillas simples/dobles de los extremos.
    * Acepta URIs ``file://`` (algunas terminales las generan al arrastrar).
    * En POSIX des-escapa las barras invertidas (``An\\ Example.json`` →
      ``An Example.json``). En Windows no se tocan, porque son separadores.
    * Expande ``~``.

    Args:
        raw: Texto introducido por el usuario.
        posix: Forzar comportamiento POSIX (``True``) o Windows (``False``);
            ``None`` detecta el sistema actual.

    Returns:
        Ruta limpia (no se verifica su existencia).
    """
    posix = (os.name != "nt") if posix is None else posix
    text = raw.strip().strip("'\"").strip()
    if text.lower().startswith("file://"):
        parsed = urlparse(text)
        text = unquote(parsed.path)
        if not posix and re.match(r"^/[A-Za-z]:", text):
            text = text[1:]
    elif posix:
        text = re.sub(r"\\(.)", r"\1", text)
    return Path(text).expanduser() if text else Path()


def validate_data_path(path: str | os.PathLike) -> Path:
    """Comprueba que la ruta apunte a un archivo ``.json`` existente.

    Args:
        path: Ruta al archivo de datos.

    Returns:
        Ruta absoluta y validada.

    Raises:
        DataFileError: Si la ruta está vacía, no tiene extensión ``.json``, no
            existe o no es un archivo.
    """
    candidate = Path(path)
    if str(path).strip() == "" or candidate == Path():
        raise DataFileError("This is an invalid path (ruta vacía).")
    if candidate.suffix.lower() != ".json":
        raise DataFileError(f"File is not a .json: {candidate}")
    if not candidate.exists():
        raise DataFileError(f"File cannot be found: {candidate}")
    if not candidate.is_file():
        raise DataFileError(f"Path is not a file: {candidate}")
    return candidate.resolve()


def load_report_data(data_input_filepath: str | os.PathLike) -> dict[str, Any]:
    """Carga y valida el archivo JSON con los datos del informe.

    Args:
        data_input_filepath: Ruta al archivo ``.json`` (no el contenido).

    Returns:
        Datos del informe como diccionario.

    Raises:
        DataFileError: Si el archivo no es válido, no es JSON o su raíz no es
            un objeto.
    """
    path = validate_data_path(data_input_filepath)
    try:
        with path.open("r", encoding="utf-8") as file_obj:
            data = json.load(file_obj)
    except json.JSONDecodeError as exc:
        raise DataFileError(f"Invalid JSON in {path.name}: {exc}") from exc
    except (OSError, UnicodeDecodeError) as exc:
        raise DataFileError(f"Cannot read {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise DataFileError(f"The root of {path.name} must be a JSON object.")
    return data


# --------------------------------------------------------------------------- #
# Renderizado
# --------------------------------------------------------------------------- #
def _safe_filename(name: str, default: str = "report") -> str:
    """Sanea un nombre de archivo: sin directorios ni caracteres prohibidos.

    Args:
        name: Nombre propuesto.
        default: Nombre a usar si el resultado queda vacío.

    Returns:
        Nombre seguro para Linux, Windows y macOS.
    """
    base = re.split(r"[\\/]", str(name))[-1]
    base = re.sub(r'[<>:"|?*\x00-\x1f]', "_", base).strip(" .")
    return base or default


def embed_file(data: dict[str, Any], output_dir: Optional[str | os.PathLike] = None) -> Path:
    """Extrae a disco el JSON embebido en ``data["file"]`` (base64).

    Funcionalidad latente heredada del original (``_embed_file``): se activa
    añadiendo la clave ``"file"`` a las secciones de un informe. El nombre del
    archivo se sanea para evitar escrituras fuera del directorio de salida.

    Args:
        data: Datos del informe; deben contener ``file.byte_string`` (base64 de
            un JSON) y ``file.filename``.
        output_dir: Directorio de salida; por defecto :data:`DEFAULT_OUTPUT_DIR`.

    Returns:
        Ruta del archivo JSON escrito.

    Raises:
        DataFileError: Si falta la estructura esperada o el contenido no es
            base64/JSON válido.
    """
    try:
        filemap = data["file"]
        content = base64.b64decode(filemap["byte_string"]).decode("utf-8")
        payload = json.loads(content)
        filename = _safe_filename(filemap["filename"], default="embedded")
    except (KeyError, TypeError, binascii.Error, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise DataFileError(f"Invalid embedded file: {exc}") from exc
    out_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{filename}.json"
    target.write_text(json.dumps(payload, indent=4), encoding="utf-8")
    return target


def render_report_html(
    data: dict[str, Any],
    report_type: str | int | ReportType,
    exclude_sections: Optional[Iterable[str]] = None,
    environment: Optional[Environment] = None,
    output_dir: Optional[str | os.PathLike] = None,
) -> str:
    """Renderiza el informe completo como HTML a partir de los datos ya cargados.

    Args:
        data: Datos del informe (ver :func:`load_report_data`).
        report_type: Tipo de informe (ver :func:`get_report_type`).
        exclude_sections: Secciones a excluir (ver :func:`resolve_exclusions`).
        environment: Entorno Liquid; por defecto :data:`env`.
        output_dir: Directorio para la sección especial ``"file"`` (si se usa).

    Returns:
        Documento HTML completo.
    """
    environment = environment or env
    html_parts: list[str] = []
    for key in compose_sections(report_type, exclude_sections):
        if key == "file":
            embed_file(data, output_dir)
        else:
            html_parts.append(environment.get_template(SECTIONS[key]).render(data))
    return mark_empty_tables("".join(html_parts))


#: Texto de la fila que se añade a las tablas sin datos.
EMPTY_TABLE_TEXT = "No data reported."
_TABLE_RE = re.compile(r"<table\b.*?</table>", re.DOTALL | re.IGNORECASE)
_EMPTY_TBODY_RE = re.compile(r"<tbody>\s*</tbody>", re.IGNORECASE)


def mark_empty_tables(html: str) -> str:
    """Añade una fila "No data reported." a las tablas cuyo ``<tbody>`` está vacío.

    Sin esto, una lista vacía en los datos produce una tabla con sólo el
    encabezado, que en el documento parece un error. La fila usa ``colspan``
    en HTML; en DOCX las celdas se combinan en :func:`format_docx_tables`, de
    modo que los tres formatos muestran lo mismo. Las tablas con datos no se
    modifican (el HTML resultante es idéntico al original).

    Args:
        html: HTML renderizado del informe.

    Returns:
        HTML con las tablas vacías marcadas.
    """
    def replace(match: re.Match) -> str:
        table = match.group(0)
        if not _EMPTY_TBODY_RE.search(table):
            return table
        columns = max(len(re.findall(r"<th\b", table, re.IGNORECASE)), 1)
        row = (f'<tbody><tr><td colspan="{columns}" class="empty-table">'
               f"<i>{EMPTY_TABLE_TEXT}</i></td></tr></tbody>")
        return _EMPTY_TBODY_RE.sub(row, table, count=1)

    return _TABLE_RE.sub(replace, html)


def process_template(
    data_input_filepath: str | os.PathLike,
    report_type: str | int | ReportType,
    exclude_sections: Optional[Iterable[str]] = None,
) -> tuple[str, str]:
    """Carga los datos y renderiza la plantilla del informe (API original).

    Se mantiene por compatibilidad con la versión 1. Las plantillas se leen de
    :data:`TEMPLATES_DIR` y ``exclude_sections`` es realmente opcional.

    Args:
        data_input_filepath: Ruta al archivo JSON de datos.
        report_type: Tipo de informe (``"1"``-``"4"``, ``"campaign"``...).
        exclude_sections: Secciones a excluir; ``None`` incluye todas.

    Returns:
        Tupla ``(html_renderizado, nombre_base)``, donde ``nombre_base`` es el
        nombre del archivo de datos sin extensión.

    Raises:
        DataFileError: Si el archivo de datos no es válido.
        InvalidReportTypeError: Si el tipo de informe no existe.
    """
    data = load_report_data(data_input_filepath)
    rendered = render_report_html(data, report_type, exclude_sections)
    return rendered, Path(data_input_filepath).stem


# --------------------------------------------------------------------------- #
# Plantillas DOCX corporativas
# --------------------------------------------------------------------------- #
#: Variable de entorno con la ruta de la plantilla DOCX corporativa por defecto.
DOCX_TEMPLATE_ENV_VAR = "CTI_DOCX_TEMPLATE"

#: Marcador opcional: párrafo de la plantilla donde se inserta el informe.
CONTENT_MARKER = "{{report_content}}"
_CONTENT_MARKER_RE = re.compile(r"^\s*\{\{\s*report_content\s*\}\}\s*$")

#: Extensiones de plantilla admitidas.
DOCX_TEMPLATE_SUFFIXES: tuple[str, ...] = (".docx", ".dotx")

_DOCX_MAIN_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
_DOTX_MAIN_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml"


class TemplateError(CTIPublishingError):
    """La plantilla DOCX no existe, no es válida o le falta un estilo solicitado."""


def resolve_docx_template(docx_template: Optional[str | os.PathLike] = None) -> Optional[Path]:
    """Determina y valida la plantilla DOCX a usar.

    Si no se indica ``docx_template`` se usa la variable de entorno
    ``CTI_DOCX_TEMPLATE`` (plantilla corporativa por defecto). Se admiten
    comillas y espacios escapados, igual que en ``-f``.

    Args:
        docx_template: Ruta a un ``.docx`` o ``.dotx``; ``None`` para usar la
            variable de entorno.

    Returns:
        Ruta absoluta validada, o ``None`` si no hay plantilla configurada.

    Raises:
        TemplateError: Si la ruta no existe, no tiene extensión ``.docx`` /
            ``.dotx`` o no es un paquete Word válido.
    """
    value = docx_template if docx_template not in (None, "") else os.environ.get(DOCX_TEMPLATE_ENV_VAR)
    if not value:
        return None
    path = clean_input_path(str(value))
    if path.suffix.lower() not in DOCX_TEMPLATE_SUFFIXES:
        raise TemplateError(f"DOCX template must be .docx or .dotx: {path}")
    if not path.is_file():
        raise TemplateError(f"DOCX template not found: {path}")
    if not dc.is_valid_docx(path):
        raise TemplateError(f"Not a valid Word document/template: {path.name}")
    return path.resolve()


def _open_docx(path: Path) -> DocxDocument:
    """Abre un ``.docx`` o ``.dotx`` con python-docx.

    python-docx rechaza las plantillas ``.dotx`` por su *content type*; se
    reescribe en memoria como documento normal (el archivo original no se
    modifica).

    Args:
        path: Ruta del archivo Word.

    Returns:
        Documento abierto.

    Raises:
        TemplateError: Si el archivo no se puede abrir.
    """
    try:
        buffer = io.BytesIO()
        with zipfile.ZipFile(path) as src, zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as dst:
            for item in src.infolist():
                data = src.read(item.filename)
                if item.filename == "[Content_Types].xml":
                    data = data.replace(_DOTX_MAIN_CT.encode(), _DOCX_MAIN_CT.encode())
                dst.writestr(item, data)
        buffer.seek(0)
        return docx.Document(buffer)
    except Exception as exc:  # zipfile/lxml/python-docx lanzan excepciones variadas
        raise TemplateError(f"Cannot open DOCX template {path.name}: {exc}") from exc


def find_content_marker(document: DocxDocument):
    """Busca el párrafo marcador ``{{report_content}}`` en el cuerpo del documento.

    Args:
        document: Documento Word.

    Returns:
        El párrafo (``docx.text.paragraph.Paragraph``) que contiene sólo el
        marcador, o ``None`` si no existe.
    """
    for paragraph in document.paragraphs:
        if _CONTENT_MARKER_RE.match(paragraph.text):
            return paragraph
    return None


_HF_REFERENCE_TAGS = (qn("w:headerReference"), qn("w:footerReference"))


def _inherit_header_footer_references(document: DocxDocument) -> int:
    """Copia a la sección final los encabezados/pies que hereda de secciones previas.

    En Word, una sección sin referencia propia ("vinculada a la anterior")
    hereda el encabezado/pie de la sección previa. Al vaciar el cuerpo se
    eliminan las secciones previas, así que la sección final perdería esos
    encabezados y pies (logos, marcas TLP, numeración). Esta función los hace
    explícitos antes de vaciar.

    Args:
        document: Documento Word (se modifica en el lugar).

    Returns:
        Número de referencias añadidas a la sección final.
    """
    body = document.element.body
    final = body.find(qn("w:sectPr"))
    if final is None:
        return 0
    inherited: dict[tuple[str, str], Any] = {}
    for sect in body.iter(qn("w:sectPr")):
        if sect is final:
            break
        for ref in sect:
            if ref.tag in _HF_REFERENCE_TAGS:
                inherited[(ref.tag, ref.get(qn("w:type"), "default"))] = ref
    own = {(ref.tag, ref.get(qn("w:type"), "default")) for ref in final if ref.tag in _HF_REFERENCE_TAGS}
    added = 0
    for key, ref in inherited.items():
        if key not in own:
            final.insert(0, copy.deepcopy(ref))  # las referencias van al inicio de w:sectPr
            added += 1
    return added


def _clear_body(document: DocxDocument) -> int:
    """Vacía el cuerpo del documento conservando la configuración de página final.

    Se conservan encabezados y pies (incluidos los heredados de secciones
    previas, ver :func:`_inherit_header_footer_references`), estilos, tema y
    el ``w:sectPr`` final (tamaño de página, márgenes, orientación). Los
    saltos de sección internos se eliminan junto con su contenido.

    Args:
        document: Documento a vaciar (se modifica en el lugar).

    Returns:
        Número de elementos (párrafos/tablas) eliminados.
    """
    _inherit_header_footer_references(document)
    body = document.element.body
    removed = 0
    for element in list(body):
        if element.tag != qn("w:sectPr"):
            body.remove(element)
            removed += 1
    return removed


def load_docx_template(docx_template: str | os.PathLike, clear_body: bool = True) -> DocxDocument:
    """Carga una plantilla DOCX/DOTX corporativa lista para recibir el informe.

    Modos de uso:

    * **Plantilla en blanco** (por defecto): se vacía el cuerpo y se conservan
      encabezado, pie, logos, márgenes, tamaño de página, fuentes, tema de
      colores y estilos.
    * **Con marcador**: si el cuerpo contiene un párrafo con
      ``{{report_content}}``, el contenido de la plantilla se conserva (portada,
      aviso legal...) y el informe se insertará en ese punto.
    * ``clear_body=False``: se conserva el contenido y el informe se añade al final.

    Args:
        docx_template: Ruta a la plantilla ``.docx`` o ``.dotx``.
        clear_body: Vaciar el cuerpo cuando no hay marcador.

    Returns:
        Documento preparado.

    Raises:
        TemplateError: Si la plantilla no es válida.
    """
    path = resolve_docx_template(docx_template)
    if path is None:
        raise TemplateError("No DOCX template given.")
    document = _open_docx(path)
    if clear_body and find_content_marker(document) is None:
        _clear_body(document)
    return document


def _style_by_name(document: DocxDocument, name: str):
    """Devuelve el estilo con ese nombre o ``None`` (admite plantillas en otros idiomas).

    Los estilos integrados se guardan con su nombre en inglés aunque Word los
    muestre traducidos (``Título 1`` → ``heading 1``), así que la búsqueda por
    nombre funciona con plantillas en español.

    Args:
        document: Documento Word.
        name: Nombre del estilo (p. ej. ``"List Bullet"``).

    Returns:
        Objeto estilo de python-docx, o ``None`` si no existe.
    """
    try:
        return document.styles[name]
    except KeyError:
        return None


def _numbering_element(document: DocxDocument):
    """Devuelve el elemento ``w:numbering`` del documento, creándolo si falta.

    python-docx no implementa ``NumberingPart.new()``; aquí se crea la parte
    ``/word/numbering.xml`` manualmente cuando la plantilla no la tiene.

    Args:
        document: Documento Word.

    Returns:
        Elemento raíz ``w:numbering``.
    """
    try:
        return document.part.numbering_part.element
    except (KeyError, NotImplementedError):
        element = parse_xml(f"<w:numbering {nsdecls('w')}/>")
        part = NumberingPart(PackURI("/word/numbering.xml"), CT.WML_NUMBERING, element,
                             document.part.package)
        document.part.relate_to(part, RT.NUMBERING)
        return element


def _copy_numbering(source: DocxDocument, target: DocxDocument, num_id: str) -> Optional[str]:
    """Copia una definición de numeración (viñetas/números) con identificadores nuevos.

    Evita que un estilo de lista copiado apunte a un ``numId`` que en la
    plantilla corresponde a otra lista (viñetas que saldrían numeradas o sin
    marcador).

    Args:
        source: Documento origen.
        target: Documento destino (se modifica).
        num_id: ``numId`` a copiar desde el origen.

    Returns:
        Nuevo ``numId`` en el destino, o ``None`` si no existía en el origen.
    """
    src = _numbering_element(source)
    num = next((n for n in src.findall(qn("w:num")) if n.get(qn("w:numId")) == num_id), None)
    if num is None:
        return None
    abstract_id = num.find(qn("w:abstractNumId")).get(qn("w:val"))
    abstract = next((a for a in src.findall(qn("w:abstractNum"))
                     if a.get(qn("w:abstractNumId")) == abstract_id), None)
    if abstract is None:
        return None

    dst = _numbering_element(target)
    new_abstract_id = str(max((int(a.get(qn("w:abstractNumId"))) for a in dst.findall(qn("w:abstractNum"))),
                              default=-1) + 1)
    new_num_id = str(max((int(n.get(qn("w:numId"))) for n in dst.findall(qn("w:num"))), default=0) + 1)

    new_abstract = copy.deepcopy(abstract)
    new_abstract.set(qn("w:abstractNumId"), new_abstract_id)
    nsid = new_abstract.find(qn("w:nsid"))
    if nsid is not None:  # identificador único: evita que Word fusione listas
        nsid.set(qn("w:val"), secrets.token_hex(4).upper())
    new_num = copy.deepcopy(num)
    new_num.set(qn("w:numId"), new_num_id)
    new_num.find(qn("w:abstractNumId")).set(qn("w:val"), new_abstract_id)

    # Orden exigido por el esquema: abstractNum antes que num; num antes de numIdMacAtCleanup.
    first_num = dst.find(qn("w:num"))
    cleanup = dst.find(qn("w:numIdMacAtCleanup"))
    if first_num is not None:
        first_num.addprevious(new_abstract)
    elif cleanup is not None:
        cleanup.addprevious(new_abstract)
    else:
        dst.append(new_abstract)
    if cleanup is not None:
        cleanup.addprevious(new_num)
    else:
        dst.append(new_num)
    return new_num_id


def _copy_style(source: DocxDocument, target: DocxDocument, name: str) -> bool:
    """Copia un estilo (y su numeración y estilo de carácter vinculado) al destino.

    Args:
        source: Documento del que se toma el estilo.
        target: Documento destino (se modifica).
        name: Nombre del estilo.

    Returns:
        ``True`` si se copió; ``False`` si el origen no lo tiene.
    """
    style = _style_by_name(source, name)
    if style is None:
        return False
    element = copy.deepcopy(style.element)
    existing_ids = {s.style_id for s in target.styles}
    style_id = element.get(qn("w:styleId"))
    if style_id in existing_ids:
        element.set(qn("w:styleId"), f"{style_id}Cti")

    ppr = element.find(qn("w:pPr"))
    num_pr = ppr.find(qn("w:numPr")) if ppr is not None else None
    num_id_el = num_pr.find(qn("w:numId")) if num_pr is not None else None
    if num_id_el is not None:
        new_id = _copy_numbering(source, target, num_id_el.get(qn("w:val")))
        if new_id is not None:
            num_id_el.set(qn("w:val"), new_id)
    target.styles.element.append(element)

    link = element.find(qn("w:link"))
    if link is not None and link.get(qn("w:val")) not in existing_ids:
        linked = next((s for s in source.styles if s.style_id == link.get(qn("w:val"))), None)
        if linked is not None:
            target.styles.element.append(copy.deepcopy(linked.element))
    return True


def required_docx_styles(rendered_template: str, table_style: Optional[str] = DOCX_TABLE_STYLE) -> list[str]:
    """Calcula los estilos de Word que ``htmldocx`` necesitará para un HTML.

    Sólo se consideran los elementos realmente presentes, para no añadir a la
    plantilla corporativa estilos que el informe no usa.

    Args:
        rendered_template: HTML del informe.
        table_style: Estilo de tabla a aplicar (si el HTML tiene tablas).

    Returns:
        Nombres de estilo necesarios (``Heading N``, ``List Bullet``,
        ``List Number`` y el estilo de tabla).
    """
    html = rendered_template.lower()
    levels = sorted({int(level) for level in re.findall(r"<h([1-6])\b", html)})
    needed = [f"Heading {level}" for level in levels]
    if "<ul" in html or ("<li" in html and "<ol" not in html):
        needed.append("List Bullet")
    if "<ol" in html:
        needed.append("List Number")
    if table_style and "<table" in html:
        needed.append(table_style)
    return needed


def ensure_docx_styles(document: DocxDocument, styles: Iterable[str],
                       table_style: Optional[str] = DOCX_TABLE_STYLE) -> list[str]:
    """Garantiza que el documento tenga los estilos indicados.

    Los estilos que la plantilla no define se copian desde la plantilla base
    de Word (python-docx), con su numeración renumerada. Los que la plantilla
    ya define se respetan (prevalece el formato corporativo).

    Args:
        document: Documento destino (se modifica).
        styles: Nombres de estilo requeridos (ver :func:`required_docx_styles`).
        table_style: Estilo de tabla solicitado; se valida que exista y sea de tabla.

    Returns:
        Nombres de los estilos añadidos.

    Raises:
        TemplateError: Si ``table_style`` no existe ni en la plantilla ni en la
            base de Word, o no es un estilo de tabla.
    """
    base = docx.Document()
    added: list[str] = []
    for name in dict.fromkeys(styles):
        if _style_by_name(document, name) is not None:
            continue
        if _copy_style(base, document, name):
            added.append(name)
        elif name == table_style:
            available = sorted(s.name for s in document.styles if s.type == WD_STYLE_TYPE.TABLE)
            raise TemplateError(f"Table style {name!r} not found. Available in template: "
                                f"{', '.join(available) or '(none)'}")
    if table_style and table_style in styles:
        style = _style_by_name(document, table_style)
        if style is not None and style.type != WD_STYLE_TYPE.TABLE:
            raise TemplateError(f"Style {table_style!r} is not a table style.")
    return added


def inspect_docx_template(docx_template: str | os.PathLike) -> dict[str, Any]:
    """Analiza una plantilla DOCX para adaptarla una sola vez al formato corporativo.

    Pensada como herramienta MCP y para ``--inspect_template``: indica qué se
    conservará (encabezado, pie, logos, márgenes, fuente) y qué estilos faltan
    y serían tomados de Word por defecto.

    Args:
        docx_template: Ruta a la plantilla ``.docx`` o ``.dotx``.

    Returns:
        Diccionario serializable con ``path``, ``sections``, ``page``,
        ``header_text``, ``footer_text``, ``header_footer_images``,
        ``normal_font``, ``body_elements``, ``content_marker``, ``mode``,
        ``table_styles``, ``missing_styles`` y ``warnings``.

    Raises:
        TemplateError: Si la plantilla no es válida.
    """
    path = resolve_docx_template(docx_template)
    if path is None:
        raise TemplateError("No DOCX template given.")
    document = _open_docx(path)
    section = document.sections[0]

    def cm(length) -> Optional[float]:
        return round(length.cm, 2) if length is not None else None

    def texts(parts) -> list[str]:
        return [p.text.strip() for part in parts for p in part.paragraphs if p.text.strip()]

    headers = [s.header for s in document.sections] + [s.first_page_header for s in document.sections]
    footers = [s.footer for s in document.sections] + [s.first_page_footer for s in document.sections]
    images = sum(len(part._element.findall(".//" + qn("w:drawing"))) for part in headers + footers)
    marker = find_content_marker(document) is not None
    body_elements = [el for el in document.element.body if el.tag != qn("w:sectPr")]
    non_empty = [el for el in body_elements
                 if el.tag != qn("w:p") or "".join(el.itertext()).strip()]
    normal = _style_by_name(document, "Normal")

    required = ["Heading 2", "Heading 3", "List Bullet", "List Number", DOCX_TABLE_STYLE]
    missing = [name for name in required if _style_by_name(document, name) is None]
    warnings_list: list[str] = []
    if non_empty and not marker:
        warnings_list.append(
            f"The template body has {len(non_empty)} element(s) that will be removed. Add a paragraph "
            f"with {CONTENT_MARKER} to keep them (e.g. cover page) or use --keep_template_content.")
    if missing:
        warnings_list.append("Missing styles will be copied from Word defaults: " + ", ".join(missing)
                             + ". Define them in the template for a fully corporate look.")
    if not headers or not (texts(headers) or images):
        warnings_list.append("The template has no header/footer text or images.")

    return {
        "path": str(path),
        "sections": len(document.sections),
        "page": {
            "width_cm": cm(section.page_width), "height_cm": cm(section.page_height),
            "margin_top_cm": cm(section.top_margin), "margin_bottom_cm": cm(section.bottom_margin),
            "margin_left_cm": cm(section.left_margin), "margin_right_cm": cm(section.right_margin),
        },
        "header_text": texts(headers),
        "footer_text": texts(footers),
        "header_footer_images": images,
        "normal_font": {
            "name": normal.font.name if normal is not None else None,
            "size_pt": normal.font.size.pt if normal is not None and normal.font.size else None,
        },
        "body_elements": len(non_empty),
        "content_marker": marker,
        "mode": "marker" if marker else "clear_body",
        "table_styles": sorted(s.name for s in document.styles if s.type == WD_STYLE_TYPE.TABLE),
        "missing_styles": missing,
        "warnings": warnings_list,
    }


# --------------------------------------------------------------------------- #
# Formato homogéneo de tablas DOCX
# --------------------------------------------------------------------------- #
#: Tamaños de letra (pt) de las tablas, de mayor a menor. Cada tabla usa el mayor
#: con el que ninguna palabra de su encabezado se parte (ver :func:`choose_table_font_size`).
TABLE_FONT_SIZES_PT: tuple[float, ...] = (9.0, 8.0, 7.5)
#: Tamaño de letra máximo de las tablas (compatibilidad).
DOCX_TABLE_FONT_SIZE_PT = TABLE_FONT_SIZES_PT[0]
#: Ancho útil por defecto (twips) si la sección no define página o márgenes (6,5").
DEFAULT_TEXT_WIDTH_TWIPS = 9360
#: Ancho (twips) de un carácter "normal" en negrita por cada punto de tamaño de letra.
#: Calibrado con LibreOffice: "Attribution" se partía con 843 twips útiles a 9 pt y
#: "Hash" con 352 twips a 8 pt; incluye un margen de seguridad.
_CHAR_TWIPS_PER_PT = 12.5
#: Ancho relativo de los caracteres estrechos y anchos (el resto cuenta 1.0).
_NARROW_CHARS = frozenset("iljtfr.,;:'!|()[]/-1 ")
_WIDE_CHARS = frozenset("mwMW@%")
#: Fracción máxima del ancho que pueden ocupar los mínimos de columna (resto: por pesos).
_MAX_MINIMUM_SHARE = 0.95
#: Margen interno izquierdo y derecho de las celdas (twips; Word usa 108 por defecto).
_CELL_MARGIN_TWIPS = 80

#: Peso relativo de cada columna según el texto de su encabezado (en minúsculas).
#: Las columnas con texto largo (procedimientos, detalles, descripciones) reciben
#: más ancho; las de códigos y fechas, menos. Así una misma tabla tiene siempre
#: las mismas proporciones, en cualquier informe y plantilla. Encabezados no
#: listados: peso 1.0.
TABLE_COLUMN_WEIGHTS: dict[str, float] = {
    # Cabecera del informe
    "report date": 1.6, "report number": 1.1, "sensitivity": 1.1,
    "traffic light protocol": 1.2, "criticality": 1.1,
    # MITRE ATT&CK
    "attribution": 1.1, "tactics": 0.9, "techniques": 1.0, "sub technique": 1.1,
    "procedure": 3.2, "d3fend": 1.9, "deployed control": 1.6,
    # IOC: malware
    "malicious tool name": 1.3, "hash type": 0.9, "file hash": 2.0, "associated files hash": 2.0,
    "brief description": 2.4, "malware analysis report (hyperlink, or n/a)": 1.6,
    "first reported": 1.2, "last reported": 1.2,
    # IOC: red y sistema
    "network artifact": 1.6, "details": 2.6, "intrusion phase": 1.2,
    "host artifact": 1.6, "type": 1.0, "tactic": 1.0,
    # IOC: CVE
    "cve number": 1.3, "cvss score": 0.8, "patch available (y/n)": 1.0,
    "other remediation": 2.4, "date reported": 1.2, "patch applied (y/n/unk/na)": 1.1,
    # Víctimas y línea de tiempo
    "name": 1.6, "sector": 1.2, "city/state/province/etc.": 1.6, "country/region": 1.2,
    "start date": 1.2, "end date": 1.2, "location": 1.3, "activity": 3.2,
}


def _header_key(text: str) -> str:
    """Normaliza el texto de un encabezado para buscarlo en :data:`TABLE_COLUMN_WEIGHTS`."""
    return re.sub(r"\s+", " ", text).strip().lower()


def text_width_twips(document: DocxDocument) -> int:
    """Calcula el ancho útil (entre márgenes) de la última sección del documento.

    Args:
        document: Documento Word.

    Returns:
        Ancho en twips; :data:`DEFAULT_TEXT_WIDTH_TWIPS` si la sección no
        define tamaño de página o márgenes.
    """
    section = document.sections[-1]
    if section.page_width is None or section.left_margin is None or section.right_margin is None:
        return DEFAULT_TEXT_WIDTH_TWIPS
    width = section.page_width - section.left_margin - section.right_margin
    return max(int(width / 635), 1440)  # 1 twip = 635 EMU; mínimo 1 pulgada


def minimum_column_widths(headers: Sequence[str], font_size_pt: float) -> list[int]:
    """Ancho mínimo de cada columna para que no se parta ninguna palabra de su encabezado.

    Las palabras se separan por espacios y barras (``City/State/...`` puede
    cortarse en cada ``/``).

    Args:
        headers: Textos de los encabezados.
        font_size_pt: Tamaño de letra de la tabla.

    Returns:
        Anchos mínimos en twips (incluyen los márgenes internos de la celda).
    """
    char = font_size_pt * _CHAR_TWIPS_PER_PT
    result = []
    for header in headers:
        words = [w for w in re.split(r"[\s/]+", header) if w] or [""]
        result.append(int(max(_text_units(w) for w in words) * char + 2 * _CELL_MARGIN_TWIPS))
    return result


def _text_units(word: str) -> float:
    """Ancho relativo aproximado de una palabra (letras estrechas 0.6, anchas 1.4, mayúsculas 1.25).

    Args:
        word: Palabra sin espacios.

    Returns:
        Ancho en "caracteres normales".
    """
    total = 0.0
    for ch in word:
        if ch in _NARROW_CHARS:
            total += 0.6
        elif ch in _WIDE_CHARS:
            total += 1.4
        elif ch.isupper():
            total += 1.25
        else:
            total += 1.0
    return total


def choose_table_font_size(headers: Sequence[str], available: int) -> float:
    """Elige el mayor tamaño de :data:`TABLE_FONT_SIZES_PT` con el que caben los encabezados.

    Args:
        headers: Textos de los encabezados.
        available: Ancho total disponible en twips.

    Returns:
        Tamaño de letra en puntos (el menor de la lista si ninguno alcanza).
    """
    for size in TABLE_FONT_SIZES_PT:
        if sum(minimum_column_widths(headers, size)) <= available * _MAX_MINIMUM_SHARE:
            return size
    return TABLE_FONT_SIZES_PT[-1]


def compute_column_widths(headers: Sequence[str], available: int,
                          font_size_pt: Optional[float] = None) -> list[int]:
    """Reparte el ancho disponible entre las columnas de una tabla.

    1. Cada columna recibe un ancho proporcional a su peso
       (:data:`TABLE_COLUMN_WEIGHTS`).
    2. Ninguna columna queda por debajo de un mínimo: el necesario para que
       la palabra más larga de su encabezado no se parta. Lo que falte se toma
       de las demás columnas, que conservan sus proporciones.
    3. Si aun con la letra más pequeña los mínimos ocupan más del
       :data:`_MAX_MINIMUM_SHARE` del ancho, se reducen en la misma
       proporción (algún encabezado podrá partirse) para que los pesos sigan
       repartiendo el resto.

    Args:
        headers: Textos de los encabezados, en orden.
        available: Ancho total disponible en twips.
        font_size_pt: Tamaño de letra de la tabla; ``None`` usa
            :func:`choose_table_font_size`.

    Returns:
        Anchos en twips; suman exactamente ``available``.
    """
    count = len(headers)
    if count == 0:
        return []
    size = font_size_pt or choose_table_font_size(headers, available)
    weights = [TABLE_COLUMN_WEIGHTS.get(_header_key(h), 1.0) for h in headers]
    minimums: list[float] = list(minimum_column_widths(headers, size))
    limit = available * _MAX_MINIMUM_SHARE
    if sum(minimums) > limit:
        minimums = [m * limit / sum(minimums) for m in minimums]

    widths = [0.0] * count
    fixed: set[int] = set()
    while True:  # converge en como máximo `count` iteraciones
        free = [i for i in range(count) if i not in fixed]
        remaining = available - sum(widths[i] for i in fixed)
        total_weight = sum(weights[i] for i in free)
        for i in free:
            widths[i] = remaining * weights[i] / total_weight
        below = [i for i in free if widths[i] < minimums[i]]
        if not below or len(below) == len(free):
            break
        for i in below:
            widths[i] = minimums[i]
            fixed.add(i)

    result = [int(w) for w in widths]
    result[result.index(max(result))] += available - sum(result)  # ajuste de redondeo
    return result


def _set_table_look(table) -> None:
    """Configura qué partes resalta el estilo de tabla.

    Encabezado resaltado y filas en bandas; sin resaltar la primera columna
    (antes la primera columna salía entera en negrita) ni la última fila.

    Args:
        table: Tabla de python-docx.
    """
    tbl_pr = table._tbl.tblPr
    look = tbl_pr.find(qn("w:tblLook"))
    if look is None:
        look = OxmlElement("w:tblLook")
        tbl_pr.append(look)
    flags = {"firstRow": 1, "lastRow": 0, "firstColumn": 0, "lastColumn": 0, "noHBand": 0, "noVBand": 1}
    for name, value in flags.items():
        look.set(qn(f"w:{name}"), str(value))
    look.set(qn("w:val"), "0420")  # firstRow (0x20) + noVBand (0x400)


def _set_row_flags(row, *, header: bool) -> None:
    """Marca una fila como encabezado repetido y no divisible, si corresponde.

    Args:
        row: Fila de python-docx.
        header: ``True`` para la fila de encabezado.
    """
    if not header:
        return
    tr_pr = row._tr.get_or_add_trPr()
    for tag in ("w:cantSplit", "w:tblHeader"):  # orden exigido por el esquema
        if tr_pr.find(qn(tag)) is None:
            tr_pr.append(OxmlElement(tag))


def _set_cell_margins(table) -> None:
    """Fija los márgenes internos izquierdo y derecho de todas las celdas de la tabla.

    Args:
        table: Tabla de python-docx.
    """
    tbl_pr = table._tbl.tblPr
    margins = tbl_pr.find(qn("w:tblCellMar"))
    if margins is None:
        margins = OxmlElement("w:tblCellMar")
        look = tbl_pr.find(qn("w:tblLook"))
        if look is not None:  # orden del esquema: tblCellMar va antes de tblLook
            look.addprevious(margins)
        else:
            tbl_pr.append(margins)
    for side in ("left", "right"):
        element = margins.find(qn(f"w:{side}"))
        if element is None:
            element = OxmlElement(f"w:{side}")
            margins.append(element)
        element.set(qn("w:w"), str(_CELL_MARGIN_TWIPS))
        element.set(qn("w:type"), "dxa")


def _format_cell_text(cell, *, bold: Optional[bool], keep_with_next: bool,
                      font_size_pt: float = DOCX_TABLE_FONT_SIZE_PT) -> None:
    """Aplica tamaño de letra y espaciado uniformes a los párrafos de una celda.

    Args:
        cell: Celda de python-docx.
        bold: ``True`` para forzar negrita (encabezados); ``None`` para no tocarla.
        keep_with_next: Mantener la fila con la siguiente (encabezado + primera fila).
        font_size_pt: Tamaño de letra en puntos.
    """
    for paragraph in cell.paragraphs:
        fmt = paragraph.paragraph_format
        fmt.space_before = Pt(0)
        fmt.space_after = Pt(2)
        fmt.line_spacing = 1.0
        if keep_with_next:
            fmt.keep_with_next = True
        runs = paragraph.runs
        for run in runs:
            run.font.size = Pt(font_size_pt)
            if bold is not None:
                run.bold = bold
        # Espacios sobrantes al inicio/fin (suelen venir de los datos, p. ej. "Chicago, Illinois ").
        if runs:
            runs[0].text = runs[0].text.lstrip()
            runs[-1].text = runs[-1].text.rstrip()


def _merge_empty_marker_rows(table) -> None:
    """Combina en una sola celda las filas "No data reported." (ver :func:`mark_empty_tables`).

    Args:
        table: Tabla de python-docx.
    """
    for row in list(table.rows)[1:]:
        cells = row.cells
        if len(cells) < 2 or cells[0].text.strip() != EMPTY_TABLE_TEXT:
            continue
        if any(c.text.strip() for c in cells[1:]):
            continue
        merged = cells[0].merge(cells[-1])
        for paragraph in merged.paragraphs[1:]:  # párrafos vacíos aportados por la combinación
            if not paragraph.text.strip():
                paragraph._p.getparent().remove(paragraph._p)


def format_docx_tables(document: DocxDocument, available_width: Optional[int] = None,
                       tables: Optional[Sequence[Any]] = None) -> int:
    """Da a las tablas del informe un formato homogéneo y estable.

    Para cada tabla:

    * Ancho total = ancho útil de la página (plantilla corporativa incluida) y
      diseño fijo, para que Word y LibreOffice (PDF) la muestren igual.
    * Anchos de columna por encabezado (:func:`compute_column_widths`), sin
      partir palabras del encabezado.
    * Encabezado en negrita, repetido en cada página, no divisible y unido a
      la primera fila; sin negrita en la primera columna.
    * Letra uniforme en toda la tabla (9 pt, o 8/7,5 pt en tablas muy anchas
      para no partir palabras del encabezado) y espaciado uniforme.
    * Filas "No data reported." combinadas en una sola celda.

    Args:
        document: Documento Word (se modifica en el lugar).
        available_width: Ancho en twips; ``None`` usa :func:`text_width_twips`.
        tables: Tablas a formatear; ``None`` formatea todas. :func:`_html_to_docx`
            pasa sólo las del informe para no alterar las tablas propias de una
            plantilla corporativa (portada, aviso legal...).

    Returns:
        Número de tablas formateadas.
    """
    available = available_width or text_width_twips(document)
    count = 0
    for table in (document.tables if tables is None else tables):
        rows = list(table.rows)
        if not rows:
            continue
        headers = [cell.text for cell in rows[0].cells]
        font_size = choose_table_font_size(headers, available)
        widths = compute_column_widths(headers, available, font_size)

        table.autofit = False  # w:tblLayout type="fixed"
        tbl_w = table._tbl.tblPr.find(qn("w:tblW"))
        if tbl_w is None:
            tbl_w = OxmlElement("w:tblW")
            table._tbl.tblPr.append(tbl_w)
        tbl_w.set(qn("w:type"), "dxa")
        tbl_w.set(qn("w:w"), str(available))
        for grid_col, width in zip(table._tbl.tblGrid.findall(qn("w:gridCol")), widths):
            grid_col.set(qn("w:w"), str(width))
        _set_table_look(table)
        _set_cell_margins(table)

        _merge_empty_marker_rows(table)
        for index, row in enumerate(table.rows):
            header = index == 0
            _set_row_flags(row, header=header)
            # Una celda combinada aparece varias veces en row.cells: se trata una sola vez,
            # con el ancho de todas las columnas que abarca.
            unique: dict[int, list] = {}
            for cell, width in zip(row.cells, widths):
                entry = unique.setdefault(id(cell._tc), [cell, 0])
                entry[1] += width
            for cell, width in unique.values():
                cell.width = Twips(width)
                _format_cell_text(cell, bold=True if header else None, keep_with_next=header,
                                  font_size_pt=font_size)
        count += 1
    return count


# --------------------------------------------------------------------------- #
# Marca de agua y numeración de páginas
# --------------------------------------------------------------------------- #
#: Formato por defecto del número de página. ``{page}`` es la página actual y
#: ``{pages}`` el total de páginas.
PAGE_NUMBER_FORMAT = "Page {page} of {pages}"
#: Color por defecto de la marca de agua (gris claro, como en Word).
WATERMARK_COLOR = "C0C0C0"
#: Longitud máxima del texto de la marca de agua.
WATERMARK_MAX_CHARS = 60

#: Estado de la numeración de páginas devuelto por :func:`generate_report`.
PageNumberStatus = Literal["added", "template", "not_applicable"]

_PAGE_TOKEN_RE = re.compile(r"\{(page|pages)\}")
_PAGE_FIELD_RE = re.compile(r"\bPAGE\b")
_HEX_COLOR_RE = re.compile(r"^#?([0-9A-Fa-f]{6})$")
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f]")

_VML_NS = ('xmlns:v="urn:schemas-microsoft-com:vml" '
           'xmlns:o="urn:schemas-microsoft-com:office:office" '
           'xmlns:w10="urn:schemas-microsoft-com:office:word"')
# Forma VML estándar de Word para texto WordArt (o:spt=136). Word y LibreOffice
# reconocen como marca de agua las formas llamadas "PowerPlusWaterMarkObject".
_WATERMARK_XML = f"""
<w:p {nsdecls("w")} {_VML_NS}>
  <w:pPr><w:pStyle w:val="Header"/></w:pPr>
  <w:r><w:rPr><w:noProof/></w:rPr><w:pict>
    <v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800"
        path="m@7,l@8,m@5,21600l@6,21600e">
      <v:formulas>
        <v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/>
        <v:f eqn="sum 0 0 @2"/><v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/>
        <v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/><v:f eqn="if @0 @4 21600"/>
        <v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/>
        <v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/>
      </v:formulas>
      <v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800"
          o:connectangles="270,180,90,0"/>
      <v:textpath on="t" fitshape="t"/>
      <v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>
      <o:lock v:ext="edit" text="t" shapetype="t"/>
    </v:shapetype>
    <v:shape type="#_x0000_t136" o:allowincell="f" stroked="f">
      <v:fill opacity=".5"/>
      <v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt"/>
      <w10:wrap anchorx="margin" anchory="margin"/>
    </v:shape>
  </w:pict></w:r>
</w:p>"""


def validate_page_number_format(page_number_format: Optional[str]) -> str:
    """Valida el formato del número de página.

    Args:
        page_number_format: Texto con ``{page}`` (obligatorio) y, opcionalmente,
            ``{pages}``; p. ej. ``"Página {page} de {pages}"``. ``None`` o vacío
            devuelve :data:`PAGE_NUMBER_FORMAT`.

    Returns:
        El formato validado.

    Raises:
        ValueError: Si falta ``{page}``, hay caracteres de control o el texto
            supera 100 caracteres.
    """
    fmt = page_number_format if page_number_format and page_number_format.strip() else PAGE_NUMBER_FORMAT
    if "{page}" not in fmt:
        raise ValueError("page_number_format must contain {page} (optionally {pages}).")
    if len(fmt) > 100 or _CONTROL_CHARS_RE.search(fmt):
        raise ValueError("page_number_format must be a single line of at most 100 characters.")
    return fmt


def validate_watermark(text: Optional[str], color: Optional[str] = None) -> tuple[Optional[str], str]:
    """Valida el texto y el color de la marca de agua.

    Args:
        text: Texto de la marca de agua (cualquier palabra o frase, p. ej.
            ``"CONFIDENCIAL"`` o ``"BORRADOR"``). ``None`` o vacío significa sin marca de agua.
        color: Color hexadecimal ``RRGGBB`` (con o sin ``#``); por defecto
            :data:`WATERMARK_COLOR`.

    Returns:
        Tupla ``(texto_normalizado_o_None, color_RRGGBB)``.

    Raises:
        ValueError: Si el texto tiene más de :data:`WATERMARK_MAX_CHARS`
            caracteres o saltos de línea, o el color no es hexadecimal.
    """
    match = _HEX_COLOR_RE.match((color or WATERMARK_COLOR).strip())
    if not match:
        raise ValueError(f"Invalid watermark color {color!r}: use hexadecimal RRGGBB, e.g. FF0000.")
    clean = " ".join(text.split()) if text else ""
    if text and _CONTROL_CHARS_RE.search(text.strip()):
        raise ValueError("The watermark must be a single line of text.")
    if len(clean) > WATERMARK_MAX_CHARS:
        raise ValueError(f"The watermark text is too long (max {WATERMARK_MAX_CHARS} characters).")
    return (clean or None), match.group(1).upper()


def has_page_number_field(element) -> bool:
    """Indica si un encabezado o pie (elemento XML) contiene un campo ``PAGE``.

    Reconoce campos complejos (``w:instrText``, aunque estén partidos en varias
    ejecuciones) y simples (``w:fldSimple``). ``NUMPAGES`` o ``PAGEREF`` no
    cuentan como número de página.
    """
    instructions = "".join(node.text or "" for node in element.iter(qn("w:instrText")))
    instructions += " ".join(node.get(qn("w:instr"), "") for node in element.iter(qn("w:fldSimple")))
    return bool(_PAGE_FIELD_RE.search(instructions))


def _field_runs(instruction: str) -> list:
    """Crea las ejecuciones de un campo complejo de Word (``PAGE`` o ``NUMPAGES``)."""
    xml = (f'<w:r {nsdecls("w")}><w:fldChar w:fldCharType="begin"/></w:r>'
           f'<w:r {nsdecls("w")}><w:instrText xml:space="preserve"> {instruction} </w:instrText></w:r>'
           f'<w:r {nsdecls("w")}><w:fldChar w:fldCharType="separate"/></w:r>'
           f'<w:r {nsdecls("w")}><w:t>1</w:t></w:r>'
           f'<w:r {nsdecls("w")}><w:fldChar w:fldCharType="end"/></w:r>')
    return list(parse_xml(f'<w:p {nsdecls("w")}>{xml}</w:p>'))


def _page_number_paragraph(page_number_format: str):
    """Crea un párrafo centrado con el texto y los campos ``PAGE``/``NUMPAGES``."""
    paragraph = parse_xml(f'<w:p {nsdecls("w")}><w:pPr><w:pStyle w:val="Footer"/>'
                          f'<w:jc w:val="center"/></w:pPr></w:p>')
    for index, piece in enumerate(_PAGE_TOKEN_RE.split(page_number_format)):
        if index % 2:  # posiciones impares: el token capturado (page o pages)
            for run in _field_runs("PAGE" if piece == "page" else "NUMPAGES"):
                paragraph.append(run)
        elif piece:
            run = OxmlElement("w:r")
            text = OxmlElement("w:t")
            text.set(qn("xml:space"), "preserve")
            text.text = piece
            run.append(text)
            paragraph.append(run)
    return paragraph


def _section_parts(document: DocxDocument, kind: Literal["header", "footer"], *, all_variants: bool):
    """Devuelve los encabezados o pies propios (sin duplicados) de cada sección.

    En la primera sección se crea el encabezado/pie si no existe. En las
    siguientes se omiten los que están vinculados al anterior (ya se tratan
    con la sección previa). Con ``all_variants`` incluye también los de la
    primera página y las páginas pares cuando el documento los usa.
    """
    even_pages = document.settings.odd_and_even_pages_header_footer
    seen: set[int] = set()
    parts = []
    for index, section in enumerate(document.sections):
        variants = [getattr(section, kind)]
        if all_variants and section.different_first_page_header_footer:
            variants.append(getattr(section, f"first_page_{kind}"))
        if all_variants and even_pages:
            variants.append(getattr(section, f"even_page_{kind}"))
        for item in variants:
            if index > 0 and item.is_linked_to_previous:
                continue
            if item.is_linked_to_previous:
                item.is_linked_to_previous = False  # crea el encabezado/pie en la primera sección
            element = item.part.element
            if id(element) not in seen:
                seen.add(id(element))
                parts.append((section, item))
    return parts


def add_page_numbers(document: DocxDocument, page_number_format: Optional[str] = None) -> int:
    """Añade el número de página al pie si el documento no lo tiene.

    Respeta las plantillas corporativas: si el encabezado o el pie de una
    sección ya contienen un campo ``PAGE`` no se toca. La portada (primera
    página diferente) no se numera, como es habitual.

    Args:
        document: Documento a modificar.
        page_number_format: Ver :func:`validate_page_number_format`.

    Returns:
        Número de pies a los que se añadió la numeración (0 si ya la tenían).

    Raises:
        ValueError: Si el formato no es válido.
    """
    fmt = validate_page_number_format(page_number_format)
    added = 0
    for section, footer in _section_parts(document, "footer", all_variants=False):
        header = section.header
        header_has = not header.is_linked_to_previous and has_page_number_field(header.part.element)
        if has_page_number_field(footer.part.element) or header_has:
            continue
        footer.part.element.append(_page_number_paragraph(fmt))
        added += 1
    return added


def document_has_page_numbers(document: DocxDocument) -> bool:
    """Indica si algún encabezado o pie del documento contiene un campo ``PAGE``."""
    for section in document.sections:
        for kind in ("header", "footer", "first_page_header", "first_page_footer",
                     "even_page_header", "even_page_footer"):
            item = getattr(section, kind)
            if not item.is_linked_to_previous and has_page_number_field(item.part.element):
                return True
    return False


def _watermark_size_pt(text: str, max_width: float = 500.0) -> tuple[float, float]:
    """Calcula ancho y alto (pt) de la forma para que el texto mantenga sus proporciones."""
    units = sum(0.35 if ch in _NARROW_CHARS else 0.8 if ch in _WIDE_CHARS else 0.62 for ch in text)
    height = min(130.0, max_width / max(units, 1.0))
    width = min(max_width, height * max(units, 1.0))
    return round(width, 1), round(height, 1)


def add_watermark(document: DocxDocument, text: str, color: Optional[str] = None) -> int:
    """Añade una marca de agua de texto en diagonal a todas las páginas.

    Usa la misma estructura que Word (forma WordArt en el encabezado, detrás
    del texto y semitransparente), por lo que Word la muestra en *Diseño >
    Marca de agua* y LibreOffice la conserva al convertir a PDF. Se añade a
    todos los encabezados (también portada y páginas pares) sin borrar su
    contenido, por lo que los logos de la plantilla se mantienen.

    Args:
        document: Documento a modificar.
        text: Texto de la marca de agua (p. ej. ``"CONFIDENCIAL"``).
        color: Color ``RRGGBB``; por defecto :data:`WATERMARK_COLOR`.

    Returns:
        Número de encabezados a los que se añadió la marca de agua.

    Raises:
        ValueError: Si el texto o el color no son válidos (ver
            :func:`validate_watermark`).
    """
    clean, rgb = validate_watermark(text, color)
    if not clean:
        raise ValueError("The watermark text is empty.")
    width, height = _watermark_size_pt(clean)
    count = 0
    for _, header in _section_parts(document, "header", all_variants=True):
        paragraph = parse_xml(_WATERMARK_XML)
        shape = paragraph.find(".//{urn:schemas-microsoft-com:vml}shape")
        count += 1
        shape.set("id", f"PowerPlusWaterMarkObject{count}")
        shape.set("{urn:schemas-microsoft-com:office:office}spid", f"_x0000_s{2048 + count}")
        shape.set("fillcolor", f"#{rgb}")
        shape.set("style", f"position:absolute;margin-left:0;margin-top:0;width:{width}pt;"
                           f"height:{height}pt;rotation:315;z-index:-251654144;"
                           "mso-position-horizontal:center;mso-position-horizontal-relative:margin;"
                           "mso-position-vertical:center;mso-position-vertical-relative:margin")
        shape.find("{urn:schemas-microsoft-com:vml}textpath").set("string", clean)
        header.part.element.append(paragraph)
    return count


def add_html_watermark(html: str, text: str, color: Optional[str] = None) -> str:
    """Añade la marca de agua a un informe HTML (texto fijo en diagonal, también al imprimir).

    Args:
        html: HTML del informe.
        text: Texto de la marca de agua.
        color: Color ``RRGGBB``; por defecto :data:`WATERMARK_COLOR`.

    Returns:
        HTML con la marca de agua antes de ``</body>`` (o al final si no hay).
    """
    import html as html_lib

    clean, rgb = validate_watermark(text, color)
    if not clean:
        return html
    div = ('<div class="cti-watermark" aria-hidden="true" style="position:fixed;top:50%;left:50%;'
           'transform:translate(-50%,-50%) rotate(-45deg);font:bold 96px Calibri,Arial,sans-serif;'
           f'color:#{rgb};opacity:.5;white-space:nowrap;pointer-events:none;z-index:9999;'
           f'-webkit-print-color-adjust:exact;print-color-adjust:exact">{html_lib.escape(clean)}</div>')
    index = html.lower().rfind("</body>")
    return html[:index] + div + html[index:] if index >= 0 else html + div


# --------------------------------------------------------------------------- #
# Exportación
# --------------------------------------------------------------------------- #
def _html_to_docx(
    rendered_template: str,
    target: Path,
    docx_template: Optional[Path] = None,
    table_style: Optional[str] = None,
    keep_template_content: bool = False,
    title: Optional[str] = None,
    subject: Optional[str] = None,
    watermark: Optional[str] = None,
    watermark_color: Optional[str] = None,
) -> dict[str, Any]:
    """Convierte HTML a DOCX con ``htmldocx``, opcionalmente sobre una plantilla.

    Sin plantilla el contenido es el de la versión original (documento Word en
    blanco) más el número de página en el pie. Con plantilla, el informe hereda
    su formato y se inserta en el marcador ``{{report_content}}`` si existe.

    Args:
        rendered_template: HTML a convertir.
        target: Ruta del DOCX de salida.
        docx_template: Plantilla ya validada (ver :func:`resolve_docx_template`).
        table_style: Estilo de tabla; por defecto :data:`DOCX_TABLE_STYLE`.
        keep_template_content: Conservar el cuerpo de la plantilla y añadir el
            informe al final (si no hay marcador).
        title: Título para las propiedades del documento (campo ``Title``).
        subject: Asunto para las propiedades del documento.
        watermark: Texto de la marca de agua (``None`` = sin marca de agua).
        watermark_color: Color ``RRGGBB`` de la marca de agua.

    Returns:
        Diccionario con ``styles_added`` (estilos que la plantilla no definía),
        ``page_numbers`` (``"added"`` o ``"template"``) y
        ``watermark_headers`` (encabezados con marca de agua).

    Raises:
        TemplateError: Si la plantilla o el estilo de tabla no son válidos.
        ValueError: Si la marca de agua o el formato de página no son válidos.
    """
    table_style = table_style or DOCX_TABLE_STYLE
    if docx_template is not None:
        document = load_docx_template(docx_template, clear_body=not keep_template_content)
    else:
        document = docx.Document()
    added = ensure_docx_styles(document, required_docx_styles(rendered_template, table_style), table_style)

    marker = find_content_marker(document) if docx_template is not None else None
    body = document.element.body
    before = set(body)
    parser = HtmlToDocx()
    parser.table_style = table_style
    with warnings.catch_warnings():
        # Filtro local: no depende de los filtros globales (unittest o un servidor MCP los cambian).
        warnings.filterwarnings("ignore", message=r".*looks (more )?like a URL.*")
        if _BS4_URL_WARNING is not None:
            warnings.simplefilter("ignore", _BS4_URL_WARNING)
        parser.add_html_to_document(rendered_template, document)
    if marker is not None:
        for element in [el for el in body if el not in before]:
            marker._p.addprevious(element)
        marker._p.getparent().remove(marker._p)
    # Sólo las tablas del informe (no las que ya traía la plantilla).
    format_docx_tables(document, tables=[t for t in document.tables if t._tbl not in before])

    if docx_template is not None:
        props = document.core_properties
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        props.title = title or props.title
        props.subject = subject or props.subject
        props.created = props.modified = now
        props.revision = 1
        if added:
            logger.warning("Template %s does not define: %s. Word default styles were used; define them "
                           "in the template for a fully corporate look.", docx_template.name, ", ".join(added))

    # Numeración automática: sólo se añade si la plantilla no numera ya las páginas.
    page_status: PageNumberStatus = "added" if add_page_numbers(document) else "template"
    watermark_headers = add_watermark(document, watermark, watermark_color) if watermark else 0
    document.save(str(target))
    return {"styles_added": added, "page_numbers": page_status, "watermark_headers": watermark_headers}


def _export(
    rendered_template: str,
    filename: str,
    doc_type: str,
    output_dir: Optional[str | os.PathLike],
    pdf_engine: dc.PdfEngine,
    docx_template: Optional[str | os.PathLike],
    table_style: Optional[str],
    keep_template_content: bool,
    title: Optional[str],
    subject: Optional[str],
    watermark: Optional[str] = None,
    watermark_color: Optional[str] = None,
) -> tuple[Path, Optional[Path], dict[str, Any]]:
    """Implementación común de :func:`export_report` y :func:`generate_report`.

    Args:
        rendered_template: HTML del informe.
        filename: Nombre base del archivo de salida.
        doc_type: ``"docx"``, ``"pdf"`` o ``"html"``.
        output_dir: Directorio de salida (``None`` = por defecto).
        pdf_engine: Motor PDF.
        docx_template: Plantilla DOCX/DOTX (``None`` = variable de entorno).
        table_style: Estilo de tabla de Word.
        keep_template_content: Conservar el cuerpo de la plantilla.
        title: Título para las propiedades del documento.
        subject: Asunto para las propiedades del documento.
        watermark, watermark_color: Ver :func:`generate_report`.

    Returns:
        Tupla ``(ruta_creada, plantilla_usada, detalles)``; ``detalles`` es el
        diccionario de :func:`_html_to_docx` (en HTML, ``page_numbers`` vale
        ``"not_applicable"``).

    Raises:
        ExportError, TemplateError, PdfEngineUnavailableError: Ver
        :func:`export_report`.
    """
    doc_type = str(doc_type).lower()
    if doc_type not in DOCUMENT_TYPES:
        raise ExportError(f"Invalid document type {doc_type!r}. Options: {', '.join(DOCUMENT_TYPES)}")
    watermark, watermark_color = validate_watermark(watermark, watermark_color)
    template = resolve_docx_template(docx_template)
    if template is not None and doc_type == "html":
        logger.info("DOCX template ignored for HTML output.")
        template = None

    out_dir = Path(output_dir).expanduser() if output_dir else DEFAULT_OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    out_dir = out_dir.resolve()
    name = _safe_filename(filename)
    target = out_dir / f"{name}.{doc_type}"
    options = dict(docx_template=template, table_style=table_style,
                   keep_template_content=keep_template_content, title=title, subject=subject,
                   watermark=watermark, watermark_color=watermark_color)

    details: dict[str, Any]
    try:
        if doc_type == "html":
            html = add_html_watermark(rendered_template, watermark, watermark_color) if watermark \
                else rendered_template
            target.write_text(html, encoding="utf-8")
            details = {"styles_added": [], "page_numbers": "not_applicable",
                       "watermark_headers": 1 if watermark else 0}
        elif doc_type == "docx":
            details = _html_to_docx(rendered_template, target, **options)
        else:
            with tempfile.TemporaryDirectory(prefix="cti_pub_") as tmp:
                temp_docx = Path(tmp) / f"{name}.docx"
                details = _html_to_docx(rendered_template, temp_docx, **options)
                dc.convert_docx_to_pdf(temp_docx, target, engine=pdf_engine)
    except dc.LibreOfficeNotFoundError as exc:
        raise PdfEngineUnavailableError(str(exc)) from exc
    except (dc.ConversionError, OSError) as exc:
        raise ExportError(f"Could not export {target.name}: {exc}") from exc

    logger.info("Document created: %s", target)
    return target, template, details


def export_report(
    rendered_template: str,
    filename: str,
    doc_type: DocumentType = "docx",
    output_dir: Optional[str | os.PathLike] = None,
    pdf_engine: dc.PdfEngine = "auto",
    docx_template: Optional[str | os.PathLike] = None,
    table_style: Optional[str] = None,
    keep_template_content: bool = False,
    document_title: Optional[str] = None,
    watermark: Optional[str] = None,
    watermark_color: Optional[str] = None,
) -> Path:
    """Exporta un HTML renderizado a DOCX, PDF o HTML.

    Para PDF se genera primero un DOCX temporal (mismo aspecto que la salida
    DOCX) y se convierte con :func:`document_converter.convert_docx_to_pdf`.
    Si el archivo de destino existe, se sobrescribe (comportamiento original).

    Args:
        rendered_template: HTML devuelto por :func:`render_report_html`.
        filename: Nombre base del archivo de salida, sin extensión.
        doc_type: ``"docx"``, ``"pdf"`` o ``"html"``.
        output_dir: Directorio de salida; por defecto :data:`DEFAULT_OUTPUT_DIR`.
        pdf_engine: Motor PDF: ``"auto"``, ``"libreoffice"`` o ``"word"``.
        docx_template: Plantilla corporativa ``.docx``/``.dotx`` (DOCX y PDF).
            ``None`` usa la variable ``CTI_DOCX_TEMPLATE`` si está definida.
        table_style: Estilo de tabla de Word; por defecto
            :data:`DOCX_TABLE_STYLE` (toma los colores del tema de la plantilla).
        keep_template_content: Conservar el cuerpo de la plantilla y añadir el
            informe al final (sin marcador ``{{report_content}}``).
        document_title: Título para las propiedades del documento.
        watermark, watermark_color: Ver :func:`generate_report`.

    Returns:
        Ruta absoluta del archivo creado.

    Raises:
        ValueError: Si la marca de agua no es válida.
        ExportError: Si ``doc_type`` no es válido o la conversión falla.
        TemplateError: Si la plantilla o el estilo de tabla no son válidos.
        PdfEngineUnavailableError: Si se pide PDF y no hay motor disponible
            (el mensaje incluye los comandos para instalar LibreOffice).
    """
    path, _, _ = _export(rendered_template, filename, doc_type, output_dir, pdf_engine,
                         docx_template, table_style, keep_template_content, document_title, None,
                         watermark, watermark_color)
    return path


def generate_report(
    data_input_filepath: Optional[str | os.PathLike],
    report_type: str | int,
    document_type: DocumentType = "docx",
    exclude_sections: Optional[Sequence[str]] = None,
    only_sections: Optional[Sequence[str]] = None,
    output_dir: Optional[str | os.PathLike] = None,
    pdf_engine: dc.PdfEngine = "auto",
    strict_sections: bool = False,
    docx_template: Optional[str | os.PathLike] = None,
    table_style: Optional[str] = None,
    keep_template_content: bool = False,
    report_data: Optional[dict[str, Any]] = None,
    output_name: Optional[str] = None,
    watermark: Optional[str] = None,
    watermark_color: Optional[str] = None,
) -> dict[str, Any]:
    """Genera un informe CTI completo: carga datos, renderiza y exporta.

    Es el punto de entrada de alto nivel (usado por el MCP Server). Los
    documentos DOCX y PDF se numeran automáticamente (*Page 1 of N* en el pie)
    salvo que la plantilla ya numere las páginas. Si se pide
    PDF, verifica el motor antes de renderizar para fallar rápido con
    instrucciones de instalación.

    Args:
        data_input_filepath: Ruta al archivo ``.json`` con los datos, o
            ``None`` si se pasan en ``report_data``.
        report_type: ``"1"``/``"campaign"``, ``"2"``/``"executive"``,
            ``"3"``/``"ia"`` o ``"4"``/``"ta"``.
        document_type: ``"docx"`` (por defecto), ``"pdf"`` o ``"html"``.
        exclude_sections: Secciones a omitir (ver :func:`list_sections`).
        only_sections: Si se indica, sólo se incluyen estas secciones
            seleccionables (excluyente con ``exclude_sections``). ``header``,
            ``intro``, ``feedback`` y ``footer`` siempre se incluyen.
        output_dir: Directorio de salida; por defecto ``output/`` del proyecto.
        pdf_engine: Motor PDF: ``"auto"``, ``"libreoffice"`` o ``"word"``.
        strict_sections: Si es ``True``, las secciones no válidas generan error
            en lugar de ignorarse.
        docx_template: Plantilla corporativa ``.docx``/``.dotx`` en blanco
            (encabezado, pie, logos, márgenes, fuentes y estilos de la
            empresa). ``None`` usa ``CTI_DOCX_TEMPLATE`` si está definida. Se
            ignora para HTML.
        table_style: Estilo de tabla de Word a aplicar (p. ej. uno corporativo
            definido en la plantilla).
        keep_template_content: Conservar el cuerpo de la plantilla y añadir el
            informe al final. Si la plantilla tiene un párrafo
            ``{{report_content}}``, el informe se inserta ahí sin necesidad de
            esta opción.
        report_data: Datos del informe ya cargados (mismo formato que el
            JSON). Excluyente con ``data_input_filepath``.
        output_name: Nombre base del archivo de salida (sin extensión). Por
            defecto, el nombre del JSON o, con ``report_data``, el
            ``report_title``. Se sanea (sin directorios).
        watermark: Palabra o frase libre que se muestra en diagonal en todas
            las páginas (p. ej. ``"CONFIDENCIAL"``, ``"BORRADOR"`` o ``"USO
            INTERNO"``); hasta :data:`WATERMARK_MAX_CHARS` caracteres. ``None``
            = sin marca de agua. En HTML se añade como texto fijo superpuesto.
        watermark_color: Color hexadecimal ``RRGGBB`` de la marca de agua; por
            defecto :data:`WATERMARK_COLOR` (gris claro). Se muestra al 50 %.

    Returns:
        Diccionario serializable con ``output_path``, ``document_type``,
        ``report_type``, ``report_label``, ``sections`` (renderizadas),
        ``excluded_sections``, ``docx_template`` (ruta o ``None``),
        ``template_styles_added`` (estilos que la plantilla no definía),
        ``watermark`` (texto o ``None``) y ``page_numbers``: ``"added"``
        (añadida al pie), ``"template"`` (ya la traía la plantilla) o
        ``"not_applicable"`` (HTML).

    Raises:
        DataFileError: Si el archivo de datos no es válido.
        InvalidReportTypeError: Si el tipo de informe no existe.
        InvalidSectionError: Con ``strict_sections`` y secciones no válidas.
        ValueError: Si se combinan ``exclude_sections`` y ``only_sections``.
        TemplateError: Si la plantilla DOCX o el estilo de tabla no son válidos.
        PdfEngineUnavailableError: Si se pide PDF sin motor disponible.
        ExportError: Si falla la exportación.
        ValueError: Si la marca de agua no es válida.
    """
    if (data_input_filepath is None) == (report_data is None):
        raise DataFileError("Provide exactly one of data_input_filepath or report_data.")
    if report_data is not None and not isinstance(report_data, dict):
        raise DataFileError("report_data must be a JSON object (dict).")
    rt = get_report_type(report_type)
    doc_type = str(document_type or "docx").lower()
    if doc_type not in DOCUMENT_TYPES:
        raise ExportError(f"Invalid document type {document_type!r}. Options: {', '.join(DOCUMENT_TYPES)}")
    if doc_type == "pdf":
        try:
            dc.resolve_pdf_engine(pdf_engine)
        except dc.LibreOfficeNotFoundError as exc:
            raise PdfEngineUnavailableError(str(exc)) from exc
    resolve_docx_template(docx_template)  # validación temprana: falla antes de renderizar
    watermark, watermark_color = validate_watermark(watermark, watermark_color)

    excluded = resolve_exclusions(rt, exclude_sections, only_sections, strict=strict_sections)
    data = report_data if report_data is not None else load_report_data(data_input_filepath)
    html = render_report_html(data, rt, excluded, output_dir=output_dir)
    title = data.get("report_title") if isinstance(data.get("report_title"), str) else None
    if output_name:
        filename = output_name
    elif data_input_filepath is not None:
        filename = Path(data_input_filepath).stem
    else:
        filename = title or "report"
    output_path, template, details = _export(
        html, filename, doc_type, output_dir, pdf_engine,
        docx_template, table_style, keep_template_content, title, rt.label,
        watermark, watermark_color)
    return {
        "output_path": str(output_path),
        "document_type": doc_type,
        "report_type": rt.key,
        "report_label": rt.label,
        "sections": compose_sections(rt, excluded),
        "excluded_sections": excluded,
        "docx_template": str(template) if template else None,
        "template_styles_added": details["styles_added"],
        "watermark": watermark,
        "page_numbers": details["page_numbers"],
    }


def check_dependencies() -> dict[str, Any]:
    """Verifica plantillas, librerías Python y motor PDF.

    No emite alertas por sí misma; devuelve toda la información para que el
    llamador (CLI o MCP) decida cómo mostrarla.

    Returns:
        Diccionario con ``python``, ``templates_dir``, ``missing_templates``,
        ``libreoffice`` (estado de :func:`document_converter.check_libreoffice`),
        ``pdf_available``, ``install_message`` (alerta con comandos si falta
        LibreOffice; ``None`` si está instalado), ``default_docx_template``
        (valor de ``CTI_DOCX_TEMPLATE``) y ``default_docx_template_error``.
    """
    missing = sorted(name for name in SECTIONS.values() if not (TEMPLATES_DIR / name).is_file())
    status = dc.check_libreoffice(warn=False)
    template_error = None
    try:
        default_template = resolve_docx_template(None)
    except TemplateError as exc:
        default_template, template_error = None, str(exc)
    return {
        "default_docx_template": str(default_template) if default_template else
        os.environ.get(DOCX_TEMPLATE_ENV_VAR),
        "default_docx_template_error": template_error,
        "python": sys.version.split()[0],
        "templates_dir": str(TEMPLATES_DIR),
        "missing_templates": missing,
        "libreoffice": status.to_dict(),
        "pdf_available": status.available or status.word_available,
        "install_message": None if status.available else dc.format_install_message(status.instructions),
    }


# --------------------------------------------------------------------------- #
# CLI guiada (interactiva)
# --------------------------------------------------------------------------- #
InputFunc = Callable[[str], str]
OutputFunc = Callable[..., None]


def _prompt_menu(title: str, options: Sequence[str], input_func: InputFunc,
                 output_func: OutputFunc) -> int:
    """Muestra un menú numerado y repite hasta recibir una opción válida.

    Args:
        title: Texto de cabecera del menú.
        options: Opciones a mostrar (se numeran desde 1).
        input_func: Función de lectura (``input`` o una simulación en pruebas).
        output_func: Función de escritura (``print`` o una simulación).

    Returns:
        Número de opción elegida (base 1).
    """
    lines = [f"\t{title}"] + [f"\t{i}. {opt}" for i, opt in enumerate(options, 1)]
    prompt = "\n".join(lines) + "\n>  "
    while True:
        answer = input_func(prompt).strip()
        if answer.isdigit() and 1 <= int(answer) <= len(options):
            return int(answer)
        output_func("Choose a valid option from the list!\n")


def prompt_report_type(input_func: InputFunc = input, output_func: OutputFunc = print) -> str:
    """Pregunta el tipo de informe.

    Args:
        input_func: Función de lectura.
        output_func: Función de escritura.

    Returns:
        Código del informe (``"1"`` a ``"4"``).
    """
    types = list(REPORT_TYPES.values())
    choice = _prompt_menu("Choose what type of report you would like to export:",
                          [rt.label for rt in types], input_func, output_func)
    selected = types[choice - 1]
    output_func(f"{selected.label} template\n")
    return selected.code


def prompt_document_type(input_func: InputFunc = input, output_func: OutputFunc = print) -> str:
    """Pregunta el formato del documento.

    Args:
        input_func: Función de lectura.
        output_func: Función de escritura.

    Returns:
        ``"docx"``, ``"pdf"`` o ``"html"``.
    """
    choice = _prompt_menu("Choose what format for the report you would like to generate:",
                          ["Microsoft Word DOCX file", "PDF", "HTML"], input_func, output_func)
    return DOCUMENT_TYPES[choice - 1]


def prompt_sections(report_type: str | int | ReportType, mode: Literal["exclude", "include"],
                    input_func: InputFunc = input, output_func: OutputFunc = print) -> list[str]:
    """Permite elegir secciones a excluir o incluir, una o varias por línea.

    Se escribe el número de la sección (se admiten varios separados por espacio
    o coma) y ``exit`` para terminar.

    Args:
        report_type: Tipo de informe.
        mode: ``"exclude"`` o ``"include"``.
        input_func: Función de lectura.
        output_func: Función de escritura.

    Returns:
        Secciones elegidas (nombres internos), en orden de renderizado.
    """
    rt = get_report_type(report_type)
    options = rt.selectable_sections
    chosen: set[str] = set()
    width = len(str(len(options)))
    menu = "\n".join(
        [f"\t\nChoose what sections (if any) you would want to {mode}:"]
        + [f"\t{str(i) + '.':<{width + 1}} {SECTION_LABELS[s]}" for i, s in enumerate(options, 1)]
        + ["\tType 'exit' when finished.", ">  "])
    while True:
        current = ", ".join(s for s in options if s in chosen) or "(none)"
        output_func("\nCurrent selection: ", current)
        answer = input_func(menu).strip()
        if answer.lower() == "exit":
            break
        tokens = [t for t in re.split(r"[\s,]+", answer) if t]
        valid = [int(t) for t in tokens if t.isdigit() and 1 <= int(t) <= len(options)]
        if not tokens or len(valid) != len(tokens):
            output_func("Choose a valid option from the list!\n")
        chosen.update(options[i - 1] for i in valid)
    return [s for s in options if s in chosen]


def prompt_include_exclude(report_type: str | int | ReportType, input_func: InputFunc = input,
                           output_func: OutputFunc = print) -> list[str]:
    """Pregunta si se excluyen secciones, se eligen sólo algunas o se dejan todas.

    Args:
        report_type: Tipo de informe.
        input_func: Función de lectura.
        output_func: Función de escritura.

    Returns:
        Secciones a excluir (nombres internos).
    """
    choice = _prompt_menu("Choose an option below:", [
        "Select the sections to exclude from the document",
        "Select the sections you would only want in the document",
        "Leave everything in the document.",
    ], input_func, output_func)
    if choice == 1:
        return prompt_sections(report_type, "exclude", input_func, output_func)
    if choice == 2:
        # Igual que el original: se excluye todo lo seleccionable que no se eligió.
        included = set(prompt_sections(report_type, "include", input_func, output_func))
        return [s for s in get_report_type(report_type).selectable_sections if s not in included]
    return []


def prompt_data_input_path(input_func: InputFunc = input, output_func: OutputFunc = print) -> Path:
    """Pide la ruta del JSON de datos hasta que sea válida (admite arrastrar y soltar).

    Args:
        input_func: Función de lectura.
        output_func: Función de escritura.

    Returns:
        Ruta absoluta a un archivo ``.json`` existente.
    """
    while True:
        raw = input_func("\t\nInput the full path to the JSON data file for the reports.\n>  ")
        try:
            return validate_data_path(clean_input_path(raw))
        except DataFileError as exc:
            output_func(f"\n{exc}. Please try again.\n")


def cli(
    report_type: Optional[str] = None,
    document_type: Optional[str] = None,
    exclude_sections: Optional[list[str]] = None,
    data_input_path: Optional[str | os.PathLike] = None,
    input_func: InputFunc = input,
    output_func: OutputFunc = print,
) -> list[Any]:
    """Asigna mediante la CLI guiada los parámetros que no se indicaron.

    Sólo pregunta por los valores que llegan como ``None``; los ya indicados
    por línea de comandos se respetan.

    Args:
        report_type: Código de informe ya conocido, o ``None`` para preguntar.
        document_type: Formato ya conocido, o ``None`` para preguntar.
        exclude_sections: Exclusiones ya conocidas, o ``None`` para preguntar.
        data_input_path: Ruta de datos ya conocida, o ``None`` para preguntar.
        input_func: Función de lectura (inyectable para pruebas).
        output_func: Función de escritura (inyectable para pruebas).

    Returns:
        ``[report_type, document_type, exclude_sections, data_input_path]``,
        igual que la versión original.
    """
    if report_type is None:
        report_type = prompt_report_type(input_func, output_func)
    if document_type is None:
        document_type = prompt_document_type(input_func, output_func)
    if exclude_sections is None:
        exclude_sections = prompt_include_exclude(report_type, input_func, output_func)
    if data_input_path is None:
        data_input_path = prompt_data_input_path(input_func, output_func)
    return [report_type, document_type, exclude_sections, Path(data_input_path)]


# --------------------------------------------------------------------------- #
# Punto de entrada
# --------------------------------------------------------------------------- #
def build_arg_parser() -> argparse.ArgumentParser:
    """Construye el parser de argumentos (compatible con la versión original).

    Returns:
        Parser configurado.
    """
    parser = argparse.ArgumentParser(
        description="Convert CTI Authoring Tool JSON exports into DOCX, PDF or HTML reports.",
        formatter_class=argparse.RawTextHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-e", "--exclude_section", action="extend", nargs="*", default=[],
                       choices=CLI_SECTION_CHOICES, metavar="SECTION",
                       help="A space separated list of sections to exclude from export.\n"
                            "Invalid sections for a report will be ignored.\n"
                            f"Choices: {', '.join(CLI_SECTION_CHOICES)}")
    group.add_argument("-o", "--only_section", action="extend", nargs="*", default=[],
                       choices=CLI_SECTION_CHOICES, metavar="SECTION",
                       help="A space separated list of sections to include in the export.\n"
                            "Invalid sections for a report will be ignored.")
    parser.add_argument("-r", "--report_type", choices=["1", "2", "3", "4"],
                        help="The report type to generate.\n1: Campaign\n2: Executive\n"
                             "3: Intrusion Analysis\n4: Threat Actor")
    parser.add_argument("-d", "--document_type", nargs="?", default=None, type=str.lower,
                        choices=list(DOCUMENT_TYPES),
                        help="Document type to export. Default value is a DOCX.")
    parser.add_argument("-f", "--data_input_filepath",
                        help="A path to the JSON data input (quotes and escaped spaces allowed).")
    parser.add_argument("--output_dir", help=f"Output directory (default: {DEFAULT_OUTPUT_DIR}).")
    parser.add_argument("--pdf_engine", choices=dc.PDF_ENGINES, default="auto",
                        help="PDF engine: auto (LibreOffice, falls back to Word on Windows/macOS),\n"
                             "libreoffice or word.")
    parser.add_argument("--docx_template", metavar="PATH",
                        help="Corporate .docx/.dotx template (header, footer, logo, margins,\n"
                             "fonts and styles) used for DOCX and PDF output.\n"
                             f"Default: ${DOCX_TEMPLATE_ENV_VAR} if set. A paragraph containing\n"
                             f"{CONTENT_MARKER} marks where the report is inserted.")
    parser.add_argument("--table_style", metavar="NAME",
                        help=f"Word table style to use (default: '{DOCX_TABLE_STYLE}').")
    parser.add_argument("--keep_template_content", action="store_true",
                        help="Keep the template body and append the report at the end.")
    parser.add_argument("--watermark", metavar="TEXT",
                        help="Diagonal text watermark on every page: any word or phrase, e.g. "
                             "\"CONFIDENCIAL\" or \"BORRADOR\" "
                             f"(max {WATERMARK_MAX_CHARS} characters; DOCX, PDF and HTML).")
    parser.add_argument("--watermark_color", metavar="RRGGBB", default=WATERMARK_COLOR,
                        help=f"Watermark color in hexadecimal (default: {WATERMARK_COLOR}, light gray).")
    parser.add_argument("--inspect_template", metavar="PATH",
                        help="Analyse a DOCX template (what is kept, missing styles) and exit.")
    parser.add_argument("--no_interactive", action="store_true",
                        help="Never prompt; fail if required arguments are missing.")
    parser.add_argument("--check_dependencies", action="store_true",
                        help="Check templates and PDF engine (LibreOffice) and exit.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show detailed log messages.")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return parser


def _print_dependencies() -> int:
    """Muestra en la terminal el resultado de :func:`check_dependencies`.

    Returns:
        0 si todo está disponible, 3 si falta el motor PDF, 1 si faltan plantillas.
    """
    deps = check_dependencies()
    lo = deps["libreoffice"]
    print(f"Python: {deps['python']}")
    print(f"Templates: {deps['templates_dir']}")
    if deps["missing_templates"]:
        print(f"  Missing templates: {', '.join(deps['missing_templates'])}")
    if deps["default_docx_template_error"]:
        print(f"DOCX template (${DOCX_TEMPLATE_ENV_VAR}): ERROR - {deps['default_docx_template_error']}",
              file=sys.stderr)
    else:
        print(f"DOCX template (${DOCX_TEMPLATE_ENV_VAR}): {deps['default_docx_template'] or 'not set'}")
    if lo["available"]:
        print(f"LibreOffice: {' '.join(lo['command'])} ({lo['version'] or 'unknown version'})")
    else:
        print(deps["install_message"], file=sys.stderr)
    if lo["system"] in ("Windows", "Darwin"):
        print(f"Microsoft Word (docx2pdf): {'available' if lo['word_available'] else 'not available'}")
    if deps["missing_templates"]:
        return 1
    return 0 if deps["pdf_available"] else 3


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Punto de entrada de línea de comandos.

    Args:
        argv: Argumentos sin el nombre del programa; ``None`` usa ``sys.argv``.

    Returns:
        Código de salida: 0 éxito, 1 error de datos/exportación, 2 argumentos
        incorrectos, 3 sin motor PDF (LibreOffice), 130 cancelado por el usuario.
    """
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING,
                        format="%(levelname)s: %(message)s", stream=sys.stderr)

    if args.check_dependencies:
        return _print_dependencies()

    if args.inspect_template:
        try:
            print(json.dumps(inspect_docx_template(args.inspect_template), indent=2, ensure_ascii=False))
        except TemplateError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 1
        return 0

    # Valida plantilla y marca de agua antes de la CLI guiada (evita preguntar en vano).
    try:
        resolve_docx_template(args.docx_template)
        validate_watermark(args.watermark, args.watermark_color)
    except (TemplateError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    exclude: Optional[list[str]] = None
    if args.report_type and (args.exclude_section or args.only_section):
        exclude = resolve_exclusions(args.report_type, args.exclude_section, args.only_section)

    data_path = clean_input_path(args.data_input_filepath) if args.data_input_filepath else None

    if args.report_type is None or data_path is None:
        interactive = not args.no_interactive and sys.stdin.isatty()
        if not interactive:
            missing = [flag for flag, value in (("-r/--report_type", args.report_type),
                                                ("-f/--data_input_filepath", data_path)) if value is None]
            parser.error(f"missing required arguments: {', '.join(missing)}")
        print("Not enough arguments provided, please make selections within the CLI.\n")
        try:
            # Si -e/-o se indicaron sin -r, se resuelven al conocer el tipo de informe.
            pending_sections = args.exclude_section or args.only_section
            report_type, document_type, exclude, data_path = cli(
                args.report_type, args.document_type,
                exclude if exclude is not None else ([] if pending_sections else None),
                data_path)
            if pending_sections and not exclude:
                exclude = resolve_exclusions(report_type, args.exclude_section, args.only_section)
            args.report_type, args.document_type = report_type, document_type
        except (KeyboardInterrupt, EOFError):
            print("\nCancelled.", file=sys.stderr)
            return 130

    try:
        result = generate_report(
            data_input_filepath=data_path,
            report_type=args.report_type,
            document_type=args.document_type or "docx",
            exclude_sections=exclude or [],
            output_dir=args.output_dir,
            pdf_engine=args.pdf_engine,
            docx_template=args.docx_template,
            table_style=args.table_style,
            keep_template_content=args.keep_template_content,
            watermark=args.watermark,
            watermark_color=args.watermark_color,
        )
    except PdfEngineUnavailableError as exc:
        print(exc, file=sys.stderr)
        return 3
    except (CTIPublishingError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"Document created: {result['output_path']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
