#!/usr/bin/env python3
"""Utilidad multiplataforma para convertir documentos DOCX a PDF.

Este módulo reemplaza la dependencia directa de ``docx2pdf`` (que sólo funciona
en Windows/macOS con Microsoft Word instalado) por un conversor que funciona en
Linux, Windows y macOS usando **LibreOffice en modo headless**.

Motores de conversión disponibles:

* ``"libreoffice"``: usa ``soffice --headless --convert-to pdf``. Funciona en
  Linux, Windows y macOS.
* ``"word"``: usa ``docx2pdf`` (Microsoft Word). Sólo Windows y macOS, y sólo si
  ``docx2pdf`` y Word están instalados.
* ``"auto"`` (por defecto): intenta LibreOffice y, si no está disponible y el
  sistema es Windows/macOS, recurre a Word.

Si LibreOffice no está instalado, el módulo emite una alerta con los comandos de
instalación adecuados para el sistema operativo y, en Linux, para la
distribución y versión detectadas a partir de ``/etc/os-release``.

Diseño orientado a un futuro MCP Server:

* Ninguna función pública escribe en ``stdout``; los mensajes van por
  ``logging`` (``stderr``), de modo que no interfieren con el transporte stdio
  de MCP. Sólo :func:`main` (CLI) imprime.
* Las funciones públicas devuelven estructuras serializables
  (``dict``/``list``/``str``) o ``Path`` y señalan errores con excepciones
  propias (:class:`ConversionError`, :class:`LibreOfficeNotFoundError`).

Uso por línea de comandos::

    python document_converter.py --check
    python document_converter.py informe.docx -o informe.pdf
"""

from __future__ import annotations

import argparse
import glob
import logging
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import zipfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal, Optional, Sequence

__all__ = [
    "ConversionError",
    "LibreOfficeNotFoundError",
    "InstallInstructions",
    "LibreOfficeStatus",
    "PdfEngine",
    "PDF_ENGINES",
    "read_os_release",
    "find_libreoffice",
    "get_libreoffice_version",
    "get_install_instructions",
    "format_install_message",
    "check_libreoffice",
    "is_word_available",
    "resolve_pdf_engine",
    "is_valid_docx",
    "convert_docx_to_pdf",
]

logger = logging.getLogger("document_converter")

#: Motores de conversión admitidos.
PdfEngine = Literal["auto", "libreoffice", "word"]
PDF_ENGINES: tuple[str, ...] = ("auto", "libreoffice", "word")

#: Variable de entorno para indicar manualmente la ruta del ejecutable ``soffice``.
LIBREOFFICE_ENV_VAR = "LIBREOFFICE_PATH"

#: Tiempo máximo (segundos) por defecto para una conversión.
DEFAULT_TIMEOUT = 180

#: Página oficial de descarga, usada como alternativa universal.
LIBREOFFICE_DOWNLOAD_URL = "https://www.libreoffice.org/download/download-libreoffice/"


# --------------------------------------------------------------------------- #
# Excepciones
# --------------------------------------------------------------------------- #
class ConversionError(RuntimeError):
    """Error genérico durante la conversión DOCX → PDF.

    Se lanza cuando el proceso de conversión termina con error, excede el tiempo
    máximo o no produce el archivo PDF esperado.
    """


class LibreOfficeNotFoundError(ConversionError):
    """LibreOffice no está disponible y no existe un motor alternativo utilizable.

    El mensaje de la excepción ya incluye la alerta y los comandos de
    instalación, listo para mostrarse al usuario.

    Attributes:
        instructions: Instrucciones de instalación para el sistema actual.
    """

    def __init__(self, message: str, instructions: "InstallInstructions"):
        super().__init__(message)
        self.instructions = instructions


# --------------------------------------------------------------------------- #
# Estructuras de datos
# --------------------------------------------------------------------------- #
@dataclass
class InstallInstructions:
    """Instrucciones para instalar LibreOffice en un sistema concreto.

    Attributes:
        system: Sistema operativo (``"Linux"``, ``"Windows"``, ``"Darwin"``...).
        distribution: Nombre legible de la distribución/versión detectada.
        package_manager: Gestor de paquetes recomendado (``apt``, ``dnf``,
            ``winget``...), o ``None`` si no hay uno claro.
        commands: Comandos recomendados, en el orden en que deben ejecutarse.
        alternatives: Comandos u opciones alternativas (Flatpak, Snap,
            instalador oficial...).
        notes: Observaciones adicionales (paquetes mínimos, avisos de soporte).
    """

    system: str
    distribution: str
    package_manager: Optional[str]
    commands: list[str] = field(default_factory=list)
    alternatives: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Devuelve las instrucciones como ``dict`` serializable a JSON."""
        return asdict(self)


@dataclass
class LibreOfficeStatus:
    """Resultado de la verificación de LibreOffice en el sistema.

    Attributes:
        available: ``True`` si se encontró un ejecutable utilizable.
        command: Comando (lista de argumentos) para invocar LibreOffice, o
            ``None`` si no está disponible.
        version: Cadena de versión reportada por ``soffice --version``, si se
            pudo obtener.
        system: Sistema operativo detectado.
        word_available: ``True`` si Microsoft Word + ``docx2pdf`` están
            disponibles como motor alternativo (sólo Windows/macOS).
        instructions: Instrucciones de instalación (siempre presentes, útiles
            aunque LibreOffice ya esté instalado).
    """

    available: bool
    command: Optional[list[str]]
    version: Optional[str]
    system: str
    word_available: bool
    instructions: InstallInstructions

    def to_dict(self) -> dict:
        """Devuelve el estado como ``dict`` serializable a JSON."""
        return asdict(self)


# --------------------------------------------------------------------------- #
# Detección del sistema operativo / distribución
# --------------------------------------------------------------------------- #
def read_os_release(path: str | os.PathLike = "/etc/os-release") -> dict[str, str]:
    """Lee y parsea el archivo ``os-release`` de una distribución Linux.

    Si ``path`` es el valor por defecto y no existe, se intenta
    ``/usr/lib/os-release`` (ubicación alternativa estándar). Las comillas de
    los valores se eliminan.

    Args:
        path: Ruta del archivo ``os-release``. Configurable para pruebas.

    Returns:
        Diccionario con las claves del archivo (``ID``, ``ID_LIKE``,
        ``VERSION_ID``, ``PRETTY_NAME``...). Vacío si no se pudo leer.
    """
    candidates = [Path(path)]
    if str(path) == "/etc/os-release":
        candidates.append(Path("/usr/lib/os-release"))

    for candidate in candidates:
        try:
            text = candidate.read_text(encoding="utf-8")
        except OSError:
            continue
        result: dict[str, str] = {}
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            result[key.strip()] = value.strip().strip('"').strip("'")
        return result
    return {}


def _version_tuple(version: str) -> tuple[int, ...]:
    """Convierte ``"22.04"`` en ``(22, 4)``; se detiene en la primera parte no numérica.

    Args:
        version: Cadena de versión (``VERSION_ID``).

    Returns:
        Tupla de enteros; vacía si no hay componentes numéricos.
    """
    parts: list[int] = []
    for chunk in version.split("."):
        digits = "".join(ch for ch in chunk if ch.isdigit())
        if not digits:
            break
        parts.append(int(digits))
    return tuple(parts)


# --------------------------------------------------------------------------- #
# Instrucciones de instalación
# --------------------------------------------------------------------------- #
_FLATPAK_CMD = "flatpak install -y flathub org.libreoffice.LibreOffice"
_FLATPAK_ALT = f"{_FLATPAK_CMD}   # alternativa universal vía Flatpak"
_SNAP_ALT = (
    "sudo snap install libreoffice   "
    "# alternativa vía Snap (confinado: puede no acceder a /tmp)"
)
_DOWNLOAD_ALT = f"Instalador oficial: {LIBREOFFICE_DOWNLOAD_URL}"


def _linux_instructions(os_release: dict[str, str]) -> InstallInstructions:
    """Construye las instrucciones de instalación para una distribución Linux.

    La decisión se toma con ``ID``, ``ID_LIKE`` y ``VERSION_ID`` de
    ``os-release``, de modo que las derivadas (Linux Mint, Pop!_OS, Kali,
    Rocky, Manjaro...) heredan la familia de su distribución base. La versión
    determina el gestor (``apt`` vs ``apt-get``, ``dnf`` vs ``yum``), la
    disponibilidad del paquete mínimo sin GUI y los avisos de fin de soporte.

    Args:
        os_release: Diccionario devuelto por :func:`read_os_release`.

    Returns:
        Instrucciones para la distribución detectada, o genéricas (Flatpak /
        instalador oficial) si la distribución no se reconoce.
    """
    distro_id = os_release.get("ID", "").lower()
    id_like = os_release.get("ID_LIKE", "").lower().split()
    family = [distro_id, *id_like]
    version_id = os_release.get("VERSION_ID", "")
    version = _version_tuple(version_id)
    pretty = os_release.get("PRETTY_NAME") or (
        f"{distro_id} {version_id}".strip() or "Linux (distribución desconocida)"
    )

    def build(pm: Optional[str], commands: list[str],
              alternatives: Optional[list[str]] = None,
              notes: Optional[list[str]] = None) -> InstallInstructions:
        return InstallInstructions(
            system="Linux",
            distribution=pretty,
            package_manager=pm,
            commands=commands,
            alternatives=alternatives if alternatives is not None else [_FLATPAK_ALT, _DOWNLOAD_ALT],
            notes=notes or [],
        )

    # --- Familia Debian / Ubuntu ------------------------------------------- #
    if "ubuntu" in family or "debian" in family:
        is_ubuntu = distro_id == "ubuntu"
        is_debian = distro_id == "debian"
        old = bool(version) and (
            (is_ubuntu and version < (16, 4)) or (is_debian and version < (9,))
        )
        apt = "apt-get" if old else "apt"
        notes = ["Para la conversión DOCX→PDF basta con 'libreoffice-writer' "
                 "(no hace falta la suite completa)."]
        alternatives = [_FLATPAK_ALT, _DOWNLOAD_ALT]
        if bool(version) and ((is_ubuntu and version >= (22, 4)) or (is_debian and version >= (11,))):
            alternatives.insert(
                0,
                f"sudo {apt} install -y --no-install-recommends libreoffice-writer-nogui"
                "   # mínimo, sin GUI (servidores)",
            )
        if is_ubuntu:
            alternatives.insert(len(alternatives) - 1, _SNAP_ALT)
        if not (is_ubuntu or is_debian):
            notes.append(f"Derivada de {' / '.join(x for x in id_like if x in ('ubuntu', 'debian'))}: "
                         "se usan los paquetes de la distribución base.")
        if old:
            notes.append(f"La versión {version_id} está fuera de soporte; los repositorios "
                         "pueden no estar disponibles. Considere actualizar el sistema.")
        return build(apt, [f"sudo {apt} update", f"sudo {apt} install -y libreoffice-writer"],
                     alternatives, notes)

    # --- Fedora ------------------------------------------------------------- #
    if distro_id == "fedora":
        pm = "dnf" if not version or version >= (22,) else "yum"
        return build(pm, [f"sudo {pm} install -y libreoffice-writer"])

    # --- RHEL y derivados (CentOS, Rocky, AlmaLinux, Oracle Linux) ---------- #
    rhel_ids = {"rhel", "centos", "rocky", "almalinux", "ol", "scientific"}
    if distro_id in rhel_ids or "rhel" in id_like:
        major = version[0] if version else 0
        if major and major <= 7:
            return build("yum", ["sudo yum install -y libreoffice-writer"],
                         notes=[f"{pretty} está fuera de soporte (EOL)."])
        if major >= 10:
            return build(
                "flatpak",
                [
                    "sudo dnf install -y flatpak",
                    "flatpak remote-add --if-not-exists flathub "
                    "https://dl.flathub.org/repo/flathub.flatpakrepo",
                    _FLATPAK_CMD,
                ],
                alternatives=[_DOWNLOAD_ALT + " (paquetes .rpm oficiales)"],
                notes=["Desde RHEL 10 LibreOffice ya no se distribuye en los repositorios "
                       "oficiales; se recomienda Flatpak o los RPM oficiales de "
                       "The Document Foundation."],
            )
        notes = []
        if major == 9:
            notes.append("En RHEL 9 LibreOffice está en AppStream pero Red Hat lo marcó "
                         "como obsoleto (deprecated).")
        return build("dnf", ["sudo dnf install -y libreoffice-writer"], notes=notes)

    # --- SUSE --------------------------------------------------------------- #
    if any(x.startswith("opensuse") or x in {"suse", "sles", "sled"} for x in family):
        return build("zypper", ["sudo zypper install -y libreoffice-writer"])

    # --- Arch y derivados --------------------------------------------------- #
    if "arch" in family or distro_id in {"manjaro", "endeavouros", "garuda"}:
        return build("pacman", ["sudo pacman -Syu --needed libreoffice-fresh"],
                     notes=["Use 'libreoffice-still' si prefiere la rama estable."])

    # --- Otras --------------------------------------------------------------- #
    if distro_id == "alpine":
        return build("apk", ["sudo apk add libreoffice"])
    if distro_id == "gentoo":
        return build("emerge", ["sudo emerge --ask app-office/libreoffice-bin"])
    if distro_id == "void":
        return build("xbps", ["sudo xbps-install -S libreoffice-writer"])
    if distro_id == "nixos":
        return build("nix", ["nix-env -iA nixos.libreoffice"],
                     notes=["O añada 'libreoffice' a environment.systemPackages."])

    return build(
        None, [_FLATPAK_CMD], alternatives=[_SNAP_ALT, _DOWNLOAD_ALT],
        notes=["Distribución no reconocida: instale el paquete 'libreoffice' con su "
               "gestor de paquetes o use Flatpak."],
    )


def get_install_instructions(
    system: Optional[str] = None,
    os_release: Optional[dict[str, str]] = None,
) -> InstallInstructions:
    """Devuelve los comandos para instalar LibreOffice en el sistema indicado.

    Args:
        system: Nombre del sistema según :func:`platform.system`
            (``"Linux"``, ``"Windows"``, ``"Darwin"``). Si es ``None`` se
            detecta automáticamente.
        os_release: Datos de ``os-release`` (sólo Linux). Si es ``None`` se
            leen de ``/etc/os-release``. Permite simular distribuciones en
            pruebas.

    Returns:
        :class:`InstallInstructions` con comandos, alternativas y notas.
    """
    system = system or platform.system()

    if system == "Windows":
        return InstallInstructions(
            system="Windows",
            distribution=f"Windows {platform.release()}".strip() if sys.platform == "win32" else "Windows",
            package_manager="winget",
            commands=["winget install -e --id TheDocumentFoundation.LibreOffice"],
            alternatives=[
                "choco install libreoffice-fresh -y   # Chocolatey",
                "scoop bucket add extras; scoop install extras/libreoffice   # Scoop",
                _DOWNLOAD_ALT,
            ],
            notes=[
                "Tras instalar, abra una nueva terminal para que se actualice el PATH.",
                "Alternativa sin LibreOffice: con Microsoft Word instalado, ejecute "
                "'pip install docx2pdf pywin32' y use --pdf_engine word.",
            ],
        )

    if system == "Darwin":
        mac_version = platform.mac_ver()[0] if sys.platform == "darwin" else ""
        return InstallInstructions(
            system="Darwin",
            distribution=f"macOS {mac_version}".strip(),
            package_manager="brew",
            commands=["brew install --cask libreoffice"],
            alternatives=[_DOWNLOAD_ALT],
            notes=["Alternativa sin LibreOffice: con Microsoft Word instalado, ejecute "
                   "'pip install docx2pdf' y use --pdf_engine word."],
        )

    if system == "Linux":
        return _linux_instructions(os_release if os_release is not None else read_os_release())

    return InstallInstructions(
        system=system, distribution=system, package_manager=None, commands=[],
        alternatives=[_DOWNLOAD_ALT],
        notes=["Sistema no reconocido: instale LibreOffice manualmente."],
    )


def format_install_message(instructions: InstallInstructions, header: Optional[str] = None) -> str:
    """Formatea las instrucciones de instalación como una alerta legible.

    Args:
        instructions: Instrucciones a formatear.
        header: Primera línea del mensaje. Si es ``None`` se usa la alerta
            estándar de "LibreOffice no encontrado".

    Returns:
        Texto multilínea listo para mostrar al usuario (CLI o respuesta MCP).
    """
    lines = [
        header or ("ALERTA: LibreOffice no está instalado o no se encuentra en el PATH. "
                   "Es necesario para generar documentos PDF."),
        f"Sistema detectado: {instructions.distribution}",
        "",
        "Comandos de instalación recomendados:",
    ]
    lines += [f"    {cmd}" for cmd in instructions.commands] or ["    (no disponible)"]
    if instructions.alternatives:
        lines += ["", "Alternativas:"] + [f"    {alt}" for alt in instructions.alternatives]
    if instructions.notes:
        lines += ["", "Notas:"] + [f"    - {note}" for note in instructions.notes]
    lines += ["", f"Si ya está instalado en una ruta no estándar, defina la variable de entorno "
                  f"{LIBREOFFICE_ENV_VAR} con la ruta completa al ejecutable 'soffice'."]
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# Detección de LibreOffice / Word
# --------------------------------------------------------------------------- #
def _windows_registry_candidates() -> list[Path]:
    """Busca la ruta de instalación de LibreOffice en el registro de Windows.

    Returns:
        Lista de rutas candidatas a ``soffice.exe``; vacía fuera de Windows o
        si no hay entradas en el registro.
    """
    if sys.platform != "win32":
        return []
    try:
        import winreg  # type: ignore[import-not-found]
    except ImportError:
        return []
    results: list[Path] = []
    for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        for key_path in (r"SOFTWARE\LibreOffice\UNO\InstallPath",
                         r"SOFTWARE\WOW6432Node\LibreOffice\UNO\InstallPath"):
            try:
                with winreg.OpenKey(hive, key_path) as key:
                    value, _ = winreg.QueryValueEx(key, "")
                    results.append(Path(value) / "soffice.exe")
            except OSError:
                continue
    return results


def _candidate_paths(system: str) -> list[Path]:
    """Rutas típicas de instalación de LibreOffice para cada sistema.

    Args:
        system: Valor de :func:`platform.system`.

    Returns:
        Lista ordenada de rutas a comprobar.
    """
    if system == "Windows":
        paths = _windows_registry_candidates()
        roots = [os.environ.get("ProgramFiles", r"C:\Program Files"),
                 os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                 os.environ.get("LOCALAPPDATA", "")]
        for root in filter(None, roots):
            paths.append(Path(root) / "LibreOffice" / "program" / "soffice.exe")
            paths.append(Path(root) / "Programs" / "LibreOffice" / "program" / "soffice.exe")
        return paths

    if system == "Darwin":
        return [Path("/Applications/LibreOffice.app/Contents/MacOS/soffice"),
                Path.home() / "Applications/LibreOffice.app/Contents/MacOS/soffice"]

    paths = [Path("/usr/bin/soffice"), Path("/usr/local/bin/soffice"),
             Path("/usr/lib/libreoffice/program/soffice"),
             Path("/usr/lib64/libreoffice/program/soffice"),
             Path("/snap/bin/libreoffice")]
    paths += [Path(p) for p in sorted(glob.glob("/opt/libreoffice*/program/soffice"), reverse=True)]
    return paths


def _flatpak_command() -> Optional[list[str]]:
    """Devuelve el comando para usar LibreOffice instalado vía Flatpak, si existe.

    Returns:
        Lista de argumentos para invocar ``soffice`` dentro de Flatpak, o
        ``None`` si Flatpak o la aplicación no están instalados.
    """
    flatpak = shutil.which("flatpak")
    if not flatpak:
        return None
    try:
        result = subprocess.run([flatpak, "info", "org.libreoffice.LibreOffice"],
                                capture_output=True, timeout=15, check=False)
    except (OSError, subprocess.SubprocessError):
        return None
    if result.returncode != 0:
        return None
    return [flatpak, "run", "--command=soffice", "org.libreoffice.LibreOffice"]


def find_libreoffice(system: Optional[str] = None) -> Optional[list[str]]:
    """Localiza el ejecutable de LibreOffice (``soffice``).

    Orden de búsqueda:

    1. Variable de entorno ``LIBREOFFICE_PATH``.
    2. ``PATH`` del sistema (``soffice``, ``libreoffice``, ``soffice.exe``...).
    3. Rutas típicas de instalación del sistema operativo (y el registro en
       Windows).
    4. Instalación Flatpak (sólo Linux).

    Args:
        system: Sistema operativo a asumir; ``None`` para detectarlo.

    Returns:
        Comando como lista de argumentos (p. ej. ``["/usr/bin/soffice"]``), o
        ``None`` si LibreOffice no se encuentra.
    """
    system = system or platform.system()

    env_path = os.environ.get(LIBREOFFICE_ENV_VAR)
    if env_path:
        candidate = Path(env_path).expanduser()
        if candidate.is_file():
            return [str(candidate)]
        logger.warning("%s=%s no apunta a un archivo existente; se ignora.",
                       LIBREOFFICE_ENV_VAR, env_path)

    names = (["soffice.exe", "soffice.com", "soffice"] if system == "Windows"
             else ["soffice", "libreoffice", "lowriter"])
    for name in names:
        found = shutil.which(name)
        if found:
            return [found]

    for candidate in _candidate_paths(system):
        if candidate.is_file():
            return [str(candidate)]

    return _flatpak_command() if system == "Linux" else None


def get_libreoffice_version(command: Sequence[str], timeout: int = 60) -> Optional[str]:
    """Obtiene la versión de LibreOffice ejecutando ``soffice --version``.

    Args:
        command: Comando devuelto por :func:`find_libreoffice`.
        timeout: Segundos máximos de espera.

    Returns:
        Cadena de versión (p. ej. ``"LibreOffice 26.2.6.3 620(Build:3)"``), o
        ``None`` si no se pudo obtener.
    """
    try:
        result = subprocess.run([*command, "--headless", "--version"], capture_output=True,
                                text=True, timeout=timeout, check=False, **_subprocess_kwargs())
    except (OSError, subprocess.SubprocessError):
        return None
    output = (result.stdout or "").strip()
    return output.splitlines()[0] if output else None


def is_word_available(system: Optional[str] = None) -> bool:
    """Indica si Microsoft Word + ``docx2pdf`` pueden usarse para convertir.

    Args:
        system: Sistema operativo a asumir; ``None`` para detectarlo.

    Returns:
        ``True`` sólo en Windows/macOS cuando ``docx2pdf`` es importable y Word
        parece estar instalado.
    """
    system = system or platform.system()
    if system not in ("Windows", "Darwin"):
        return False
    try:
        import docx2pdf  # noqa: F401  # type: ignore[import-not-found]
    except ImportError:
        return False
    if system == "Darwin":
        return Path("/Applications/Microsoft Word.app").exists()
    try:
        import win32com.client  # noqa: F401  # type: ignore[import-not-found]
    except ImportError:
        return False
    return True


def check_libreoffice(warn: bool = True, include_version: bool = True,
                      system: Optional[str] = None) -> LibreOfficeStatus:
    """Verifica si LibreOffice está disponible y, si no, emite una alerta.

    Args:
        warn: Si es ``True`` y LibreOffice no está disponible, registra una
            alerta (``logging.WARNING``, a ``stderr``) con los comandos de
            instalación.
        include_version: Si es ``True`` ejecuta ``soffice --version`` (puede
            tardar unos segundos la primera vez).
        system: Sistema operativo a asumir; ``None`` para detectarlo.

    Returns:
        :class:`LibreOfficeStatus` con disponibilidad, comando, versión e
        instrucciones de instalación.
    """
    system = system or platform.system()
    command = find_libreoffice(system)
    status = LibreOfficeStatus(
        available=command is not None,
        command=command,
        version=get_libreoffice_version(command) if (command and include_version) else None,
        system=system,
        word_available=is_word_available(system),
        instructions=get_install_instructions(system),
    )
    if warn and not status.available:
        logger.warning("%s", format_install_message(status.instructions))
    return status


def resolve_pdf_engine(engine: PdfEngine = "auto", system: Optional[str] = None) -> str:
    """Determina qué motor de conversión se usará realmente.

    Args:
        engine: Motor solicitado: ``"auto"``, ``"libreoffice"`` o ``"word"``.
        system: Sistema operativo a asumir; ``None`` para detectarlo.

    Returns:
        ``"libreoffice"`` o ``"word"``.

    Raises:
        ValueError: Si ``engine`` no es un motor válido.
        LibreOfficeNotFoundError: Si no hay ningún motor disponible. El mensaje
            incluye la alerta y los comandos de instalación de LibreOffice.
    """
    if engine not in PDF_ENGINES:
        raise ValueError(f"Motor PDF no válido: {engine!r}. Opciones: {', '.join(PDF_ENGINES)}")
    system = system or platform.system()

    if engine in ("auto", "libreoffice") and find_libreoffice(system):
        return "libreoffice"
    if engine in ("auto", "word") and is_word_available(system):
        return "word"

    instructions = get_install_instructions(system)
    header = None
    if engine == "word":
        header = ("ALERTA: el motor 'word' requiere Windows/macOS con Microsoft Word y "
                  "'docx2pdf' instalados. Como alternativa instale LibreOffice:")
    raise LibreOfficeNotFoundError(format_install_message(instructions, header), instructions)


# --------------------------------------------------------------------------- #
# Conversión
# --------------------------------------------------------------------------- #
def _subprocess_kwargs() -> dict:
    """Argumentos extra para ``subprocess`` (oculta la ventana de consola en Windows).

    Returns:
        Diccionario con ``creationflags`` en Windows; vacío en otros sistemas.
    """
    if sys.platform == "win32":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)}
    return {}


def _convert_with_libreoffice(command: Sequence[str], docx_path: Path, pdf_path: Path,
                              timeout: int) -> None:
    """Convierte con LibreOffice headless usando un perfil de usuario aislado.

    El perfil temporal (``-env:UserInstallation``) evita el fallo silencioso
    que ocurre cuando ya hay una instancia de LibreOffice abierta y permite
    conversiones concurrentes (útil en un MCP Server).

    Args:
        command: Comando de LibreOffice.
        docx_path: Archivo DOCX de entrada.
        pdf_path: Ruta final del PDF.
        timeout: Segundos máximos de espera.

    Raises:
        ConversionError: Si el proceso falla, excede el tiempo o no genera el PDF.
    """
    with tempfile.TemporaryDirectory(prefix="cti_lo_") as work:
        work_dir = Path(work)
        out_dir = work_dir / "out"
        out_dir.mkdir()
        args = [
            *command,
            f"-env:UserInstallation={(work_dir / 'profile').as_uri()}",
            "--headless", "--norestore", "--nolockcheck", "--nodefault",
            "--convert-to", "pdf:writer_pdf_Export",
            "--outdir", str(out_dir),
            str(docx_path),
        ]
        logger.info("Ejecutando: %s", " ".join(args))
        try:
            result = subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                                    check=False, **_subprocess_kwargs())
        except subprocess.TimeoutExpired as exc:
            raise ConversionError(f"LibreOffice excedió el tiempo máximo de {timeout} s "
                                  f"al convertir {docx_path.name}") from exc
        except OSError as exc:
            raise ConversionError(f"No se pudo ejecutar LibreOffice: {exc}") from exc

        produced = out_dir / (docx_path.stem + ".pdf")
        if result.returncode != 0 or not produced.is_file():
            detail = (result.stderr or result.stdout or "").strip()
            raise ConversionError(
                f"LibreOffice no generó el PDF (código {result.returncode}). {detail}".strip())
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(produced), str(pdf_path))


def _convert_with_word(docx_path: Path, pdf_path: Path) -> None:
    """Convierte usando Microsoft Word a través de ``docx2pdf``.

    Args:
        docx_path: Archivo DOCX de entrada.
        pdf_path: Ruta final del PDF.

    Raises:
        ConversionError: Si ``docx2pdf`` no está instalado, falla o no genera el PDF.
    """
    try:
        from docx2pdf import convert  # type: ignore[import-not-found]
    except ImportError as exc:
        raise ConversionError("docx2pdf no está instalado: pip install docx2pdf") from exc
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        convert(str(docx_path), str(pdf_path))
    except Exception as exc:  # docx2pdf lanza excepciones variadas (COM, AppleScript...)
        raise ConversionError(f"Microsoft Word no pudo convertir el documento: {exc}") from exc
    if not pdf_path.is_file():
        raise ConversionError("Microsoft Word no generó el PDF.")


def is_valid_docx(path: str | os.PathLike) -> bool:
    """Comprueba que un archivo sea un DOCX real (ZIP con ``word/document.xml``).

    Args:
        path: Ruta del archivo a comprobar.

    Returns:
        ``True`` si el archivo es un paquete DOCX válido.
    """
    try:
        with zipfile.ZipFile(path) as archive:
            return "word/document.xml" in archive.namelist()
    except (zipfile.BadZipFile, OSError):
        return False


def convert_docx_to_pdf(
    docx_path: str | os.PathLike,
    pdf_path: Optional[str | os.PathLike] = None,
    engine: PdfEngine = "auto",
    timeout: int = DEFAULT_TIMEOUT,
) -> Path:
    """Convierte un archivo DOCX a PDF con el motor indicado.

    Args:
        docx_path: Ruta al archivo ``.docx`` de entrada (debe existir).
        pdf_path: Ruta del PDF de salida. Si es ``None`` se usa la ruta del
            DOCX con extensión ``.pdf``. Si es un directorio existente, el PDF
            se crea dentro con el nombre del DOCX.
        engine: ``"auto"`` (LibreOffice y, si falta, Word en Windows/macOS),
            ``"libreoffice"`` o ``"word"``.
        timeout: Segundos máximos para la conversión con LibreOffice.

    Returns:
        Ruta absoluta del PDF generado.

    Raises:
        FileNotFoundError: Si ``docx_path`` no existe.
        ValueError: Si ``engine`` no es válido.
        LibreOfficeNotFoundError: Si no hay ningún motor disponible (el
            mensaje incluye los comandos de instalación).
        ConversionError: Si el archivo no es un DOCX válido o la conversión falla.
    """
    source = Path(docx_path).expanduser().resolve()
    if not source.is_file():
        raise FileNotFoundError(f"No existe el archivo DOCX: {source}")
    if not is_valid_docx(source):
        # LibreOffice importaría un archivo corrupto como texto plano y generaría
        # un PDF con contenido basura en lugar de fallar.
        raise ConversionError(f"El archivo no es un DOCX válido: {source.name}")

    if pdf_path is None:
        target = source.with_suffix(".pdf")
    else:
        target = Path(pdf_path).expanduser()
        if target.is_dir():
            target = target / (source.stem + ".pdf")
        target = target.resolve()

    selected = resolve_pdf_engine(engine)
    logger.info("Convirtiendo %s -> %s (motor: %s)", source, target, selected)
    if selected == "libreoffice":
        command = find_libreoffice()
        if command is None:  # pragma: no cover - desinstalado entre comprobaciones
            instructions = get_install_instructions()
            raise LibreOfficeNotFoundError(format_install_message(instructions), instructions)
        _convert_with_libreoffice(command, source, target, timeout)
    else:
        _convert_with_word(source, target)
    return target


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv: Optional[Sequence[str]] = None) -> int:
    """Punto de entrada de línea de comandos del conversor.

    Sin argumentos (o con ``--check``) verifica LibreOffice y muestra los
    comandos de instalación si falta. Con un archivo, lo convierte a PDF.

    Args:
        argv: Argumentos (sin el nombre del programa). ``None`` usa ``sys.argv``.

    Returns:
        Código de salida: 0 éxito, 1 error de conversión, 3 sin motor PDF disponible.
    """
    parser = argparse.ArgumentParser(
        description="Convierte DOCX a PDF (LibreOffice/Word) y verifica dependencias.")
    parser.add_argument("docx", nargs="?", help="Archivo DOCX a convertir.")
    parser.add_argument("-o", "--output", help="Ruta o directorio del PDF de salida.")
    parser.add_argument("--engine", choices=PDF_ENGINES, default="auto",
                        help="Motor PDF: auto (LibreOffice; Word en Windows/macOS si falta), "
                             "libreoffice o word. Por defecto: auto.")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                        help=f"Segundos máximos de conversión. Por defecto: {DEFAULT_TIMEOUT}.")
    parser.add_argument("--check", action="store_true",
                        help="Verifica LibreOffice y muestra comandos de instalación.")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.WARNING, format="%(message)s", stream=sys.stderr)

    if args.check or not args.docx:
        status = check_libreoffice(warn=False)
        if status.available:
            print(f"LibreOffice disponible: {' '.join(status.command or [])}")
            print(f"Versión: {status.version or 'desconocida'}")
        else:
            print(format_install_message(status.instructions), file=sys.stderr)
        if status.system in ("Windows", "Darwin"):
            print(f"Motor Word (docx2pdf) disponible: {'sí' if status.word_available else 'no'}")
        return 0 if (status.available or status.word_available) else 3

    try:
        result = convert_docx_to_pdf(args.docx, args.output, args.engine, args.timeout)
    except LibreOfficeNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 3
    except (ConversionError, FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"PDF creado: {result}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
