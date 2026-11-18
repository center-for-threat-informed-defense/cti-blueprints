"""Tests funcionales de ``cti_publishing_tool_v2`` y ``document_converter``.

Ejecutar desde la raíz del proyecto::

    create_report/bin/python -m unittest discover -s tests -v

Los documentos se generan en directorios temporales; nunca en ``output/``.
Los tests de PDF reales se omiten si LibreOffice no está instalado; la
ausencia de LibreOffice se prueba además simulándola.
"""

from __future__ import annotations

import contextlib
import importlib.machinery
import importlib.util
import inspect
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
import warnings
from pathlib import Path
from unittest import mock

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

import cti_publishing_tool_v2 as tool  # noqa: E402
import document_converter as dc  # noqa: E402

from docx import Document  # noqa: E402  (python-docx, dependencia de htmldocx)

PYTHON = sys.executable
SCRIPT = PROJECT_DIR / "cti_publishing_tool_v2.py"
DATA = {
    "campaign": PROJECT_DIR / "data" / "An Example Campaign Report.json",
    "executive": PROJECT_DIR / "data" / "An Example Executive Report.json",
    "ia": PROJECT_DIR / "data" / "An Example Intrusion Analysis Report.json",
    "ta": PROJECT_DIR / "data" / "An Example Threat Actor Report.json",
}
CODES = {"campaign": "1", "executive": "2", "ia": "3", "ta": "4"}

#: Marca HTML única de cada sección (título que define su plantilla).
MARKERS = {
    "executive_summary": "<h2>Executive Summary</h2>",
    "key_points": "<h2>Key Points</h2>",
    "assessment": "<h2>Assessment</h2>",
    "indicator_analysis": "<h2>Indicator Analysis</h2>",
    "outlook": "<h2>Outlook</h2>",
    "threat_actor": "<h2>Threat Actor</h2>",
    "intelligence_gaps": "<h2>Key Intelligence Gaps</h2>",
    "mitre_attack_table": "MITRE ATT&amp;CK Table (based on v12)</h2>",
    "mitre_attack_table_ia": "TTPs Observed in the Intrusion</h2>",
    "victims": "<h2>Victims</h2>",
    "timeline": "<h2>Timeline of Activity</h2>",
    "iocs": "Indicators of Compromise (IOC)",
    "signatures": "<h2>Signatures</h2>",
    "intelligence_requirements": "<h2>Intelligence Requirements</h2>",
    "feedback": "<h2>Feedback</h2>",
    "data_sources": "<h3>Data Sources:</h3>",
    "metadata": "<h2>Metadata</h2>",
    "metadata_ia": "<h2>Metadata</h2>",
}

LIBREOFFICE = dc.find_libreoffice()


def run_cli(*args: str, cwd: Path | str = PROJECT_DIR, stdin: str | None = None,
            env: dict | None = None) -> subprocess.CompletedProcess:
    """Ejecuta el script v2 como proceso independiente (sin terminal interactiva)."""
    return subprocess.run([PYTHON, str(SCRIPT), *args], cwd=str(cwd), input=stdin,
                          capture_output=True, text=True, timeout=300,
                          env=env or {**os.environ, "PYTHONWARNINGS": "error::SyntaxWarning"})


def docx_text(path: Path) -> str:
    """Devuelve todo el texto (párrafos y tablas) de un DOCX."""
    doc = Document(str(path))
    parts = [p.text for p in doc.paragraphs]
    for table in doc.tables:
        for row in table.rows:
            parts.extend(cell.text for cell in row.cells)
    return "\n".join(parts)


class TempOutputMixin(unittest.TestCase):
    """Proporciona ``self.out``: un directorio de salida temporal por test."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory(prefix="cti_test_")
        self.out = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()


# --------------------------------------------------------------------------- #
# 1. Código y documentación
# --------------------------------------------------------------------------- #
class TestCodeQuality(unittest.TestCase):
    """Sintaxis, ausencia de SyntaxWarning y docstrings completos."""

    def test_no_syntax_warnings(self):
        for name in ("cti_publishing_tool_v2.py", "document_converter.py"):
            source = (PROJECT_DIR / name).read_text(encoding="utf-8")
            with warnings.catch_warnings():
                warnings.simplefilter("error")
                compile(source, name, "exec")

    def test_every_function_and_class_has_docstring(self):
        missing = []
        for module in (tool, dc):
            if not inspect.getdoc(module):
                missing.append(module.__name__)
            for name, obj in vars(module).items():
                if getattr(obj, "__module__", None) != module.__name__:
                    continue
                if inspect.isfunction(obj) or inspect.isclass(obj):
                    if not obj.__doc__:
                        missing.append(f"{module.__name__}.{name}")
                    if inspect.isclass(obj):
                        for mname, member in vars(obj).items():
                            if inspect.isfunction(member) and not mname.startswith("__") \
                                    and not member.__doc__:
                                missing.append(f"{module.__name__}.{name}.{mname}")
        self.assertEqual(missing, [], f"Sin docstring: {missing}")

    def test_public_functions_have_type_hints(self):
        public = ["list_report_types", "list_sections", "resolve_exclusions",
                  "render_report_html", "generate_report", "export_report",
                  "process_template", "load_report_data", "check_dependencies"]
        for name in public:
            hints = getattr(tool, name).__annotations__
            self.assertIn("return", hints, f"{name} sin tipo de retorno")

    @unittest.skipUnless((PROJECT_DIR / "cti_publishing_tool.py.bak").is_file(),
                         "respaldo local no presente (no se versiona)")
    def test_original_untouched_and_backup_identical(self):
        original = (PROJECT_DIR / "cti_publishing_tool.py").read_bytes()
        backup = (PROJECT_DIR / "cti_publishing_tool.py.bak").read_bytes()
        self.assertEqual(original, backup)


# --------------------------------------------------------------------------- #
# 2. Generación de documentos (CLI real, todos los tipos)
# --------------------------------------------------------------------------- #
class TestGenerationCLI(TempOutputMixin):
    """Generación de extremo a extremo invocando el script como lo haría un usuario."""

    def test_docx_all_report_types(self):
        for key, path in DATA.items():
            with self.subTest(report=key):
                result = run_cli("-r", CODES[key], "-f", str(path), "--output_dir", str(self.out))
                self.assertEqual(result.returncode, 0, result.stderr)
                target = self.out / f"{path.stem}.docx"
                self.assertTrue(target.is_file())
                self.assertIn("Document created:", result.stdout)
                self.assertNotIn("Traceback", result.stderr)
                self.assertNotIn("SyntaxWarning", result.stderr)
                self.assertNotIn("MarkupResemblesLocatorWarning", result.stderr)
                self.assertIn("Key Points", docx_text(target))

    def test_html_output(self):
        result = run_cli("-r", "2", "-d", "html", "-f", str(DATA["executive"]),
                         "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 0, result.stderr)
        html = (self.out / f"{DATA['executive'].stem}.html").read_text(encoding="utf-8")
        self.assertIn("</html>", html)
        self.assertIn(MARKERS["outlook"], html)

    @unittest.skipUnless(LIBREOFFICE, "LibreOffice no instalado")
    def test_pdf_all_report_types_with_libreoffice(self):
        for key, path in DATA.items():
            with self.subTest(report=key):
                result = run_cli("-r", CODES[key], "-d", "pdf", "-f", str(path),
                                 "--output_dir", str(self.out))
                self.assertEqual(result.returncode, 0, result.stderr)
                pdf = self.out / f"{path.stem}.pdf"
                self.assertEqual(pdf.read_bytes()[:5], b"%PDF-")
                self.assertGreater(pdf.stat().st_size, 10_000)
                # No deben quedar DOCX temporales junto al PDF.
                self.assertFalse((self.out / f"{path.stem}.docx").exists())

    def test_runs_from_any_working_directory(self):
        with tempfile.TemporaryDirectory() as other_cwd:
            result = run_cli("-r", "1", "-f", str(DATA["campaign"]),
                             "--output_dir", str(self.out), cwd=other_cwd)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((Path(other_cwd) / "output").exists())
        self.assertTrue((self.out / f"{DATA['campaign'].stem}.docx").is_file())

    def test_escaped_and_quoted_paths(self):
        escaped = str(DATA["ta"]).replace(" ", "\\ ")
        for variant in (escaped, f"'{DATA['ta']}'", f'"{DATA["ta"]}"', DATA["ta"].as_uri()):
            with self.subTest(path=variant):
                result = run_cli("-r", "4", "-d", "html", "-f", variant,
                                 "--output_dir", str(self.out))
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_only_section_cli(self):
        result = run_cli("-r", "2", "-d", "html", "-o", "key_points",
                         "-f", str(DATA["executive"]), "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 0, result.stderr)
        html = (self.out / f"{DATA['executive'].stem}.html").read_text(encoding="utf-8")
        self.assertIn(MARKERS["key_points"], html)
        self.assertIn(MARKERS["feedback"], html)  # sección fija
        for section in ("executive_summary", "assessment", "outlook", "intelligence_gaps"):
            self.assertNotIn(MARKERS[section], html, section)


# --------------------------------------------------------------------------- #
# 3. Errores y validación de argumentos (antes eran tracebacks)
# --------------------------------------------------------------------------- #
class TestErrorHandling(TempOutputMixin):
    """Los errores deben producir mensajes claros y códigos de salida, no tracebacks."""

    def test_missing_report_type_non_interactive(self):
        result = run_cli("-f", str(DATA["campaign"]), "-e", "iocs", stdin="")
        self.assertEqual(result.returncode, 2)
        self.assertIn("-r/--report_type", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_missing_file_non_interactive(self):
        result = run_cli("-r", "1", "-d", "pdf", "--no_interactive")
        self.assertEqual(result.returncode, 2)
        self.assertIn("-f/--data_input_filepath", result.stderr)

    def test_nonexistent_file(self):
        result = run_cli("-r", "1", "-f", "noexiste.json", "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 1)
        self.assertIn("File cannot be found", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_not_json_extension(self):
        result = run_cli("-r", "1", "-f", str(PROJECT_DIR / "README.md"))
        self.assertEqual(result.returncode, 1)
        self.assertIn("not a .json", result.stderr)

    def test_invalid_json_content(self):
        bad = self.out / "bad.json"
        bad.write_text("{ not json", encoding="utf-8")
        result = run_cli("-r", "1", "-f", str(bad), "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 1)
        self.assertIn("Invalid JSON", result.stderr)

    def test_invalid_document_type_rejected(self):
        with self.assertRaises(tool.ExportError):
            tool.export_report("<html></html>", "x", "odt", self.out)  # type: ignore[arg-type]

    def test_invalid_report_type(self):
        with self.assertRaises(tool.InvalidReportTypeError):
            tool.get_report_type("9")

    def test_exclude_and_only_are_exclusive(self):
        with self.assertRaises(ValueError):
            tool.resolve_exclusions("1", ["iocs"], ["key_points"])

    def test_strict_sections(self):
        with self.assertRaises(tool.InvalidSectionError):
            tool.resolve_exclusions("2", ["victims"], strict=True)
        self.assertEqual(tool.resolve_exclusions("2", ["victims"]), [])  # ignorada


# --------------------------------------------------------------------------- #
# 4. Selección de secciones (errores lógicos corregidos)
# --------------------------------------------------------------------------- #
class TestSections(unittest.TestCase):
    """Corrección de la tabla MITRE del informe IA, metadata y -e/-o."""

    @classmethod
    def setUpClass(cls):
        cls.data = {k: tool.load_report_data(p) for k, p in DATA.items()}

    def render(self, key, exclude=None, only=None):
        excluded = tool.resolve_exclusions(key, exclude, only)
        return tool.render_report_html(self.data[key], key, excluded)

    def test_full_reports_contain_all_their_sections(self):
        for key in DATA:
            html = self.render(key)
            for section in tool.REPORT_TYPES[key].body_sections:
                with self.subTest(report=key, section=section):
                    self.assertIn(MARKERS[section], html)

    def test_ia_only_mitre_keeps_mitre_table(self):
        html = self.render("ia", only=["mitre_attack_table", "iocs"])
        self.assertIn(MARKERS["mitre_attack_table_ia"], html)
        self.assertIn(MARKERS["iocs"], html)
        self.assertNotIn(MARKERS["key_points"], html)
        self.assertNotIn(MARKERS["metadata_ia"], html)

    def test_ia_exclude_mitre_generic_name(self):
        self.assertNotIn(MARKERS["mitre_attack_table_ia"], self.render("ia", exclude=["mitre_attack_table"]))
        self.assertNotIn(MARKERS["metadata_ia"], self.render("ia", exclude=["metadata"]))

    def test_metadata_rendered_and_excludable(self):
        for key in ("campaign", "ia", "ta"):
            with self.subTest(report=key):
                self.assertIn(MARKERS["metadata"], self.render(key))
                self.assertNotIn(MARKERS["metadata"], self.render(key, exclude=["metadata"]))
        self.assertNotIn(MARKERS["metadata"], self.render("executive"))

    def test_metadata_is_last_body_section(self):
        html = self.render("campaign")
        self.assertLess(html.index(MARKERS["data_sources"]), html.index(MARKERS["metadata"]))

    def test_section_order_preserved(self):
        html = self.render("ta")
        positions = [html.index(MARKERS[s]) for s in tool.REPORT_TYPES["ta"].body_sections
                     if s != "metadata"]
        self.assertEqual(positions, sorted(positions))

    def test_resolve_section_name_aliases(self):
        self.assertEqual(tool.resolve_section_name("ia", "mitre_attack_table"), "mitre_attack_table_ia")
        self.assertEqual(tool.resolve_section_name("1", "mitre_attack_table_ia"), "mitre_attack_table")
        self.assertEqual(tool.resolve_section_name("ta", "METADATA"), "metadata")
        self.assertIsNone(tool.resolve_section_name("executive", "victims"))

    def test_header_and_footer_always_present(self):
        sections = tool.compose_sections("1", ["header", "footer", "intro"])
        self.assertEqual(sections[:2], ["header", "intro"])
        self.assertEqual(sections[-1], "footer")


# --------------------------------------------------------------------------- #
# 5. Compatibilidad con el original
# --------------------------------------------------------------------------- #
class TestParityWithOriginal(unittest.TestCase):
    """El HTML de v2 debe ser el del original salvo las correcciones documentadas."""

    @classmethod
    def setUpClass(cls):
        cwd = os.getcwd()
        os.chdir(PROJECT_DIR)  # el original usa rutas relativas al cwd
        try:
            loader = importlib.machinery.SourceFileLoader(
                "cti_original", str(PROJECT_DIR / "cti_publishing_tool.py"))  # v1 sin cambios
            spec = importlib.util.spec_from_loader("cti_original", loader)
            cls.original = importlib.util.module_from_spec(spec)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                loader.exec_module(cls.original)
            cls.cwd = cwd
        except Exception:
            os.chdir(cwd)
            raise

    @classmethod
    def tearDownClass(cls):
        os.chdir(cls.cwd)

    @staticmethod
    def normalize(html: str) -> str:
        """Unifica saltos de línea: la única diferencia esperada del filtro corregido."""
        return html.replace("<br>", "\n")

    def test_same_html_except_documented_fixes(self):
        for key, path in DATA.items():
            with self.subTest(report=key):
                # El original nunca renderizaba metadata: se excluye para comparar.
                original_html, original_name = self.original.process_template(
                    str(path), CODES[key], [])
                v2_html, v2_name = tool.process_template(path, CODES[key], ["metadata"])
                self.assertEqual(original_name, v2_name)
                self.assertEqual(self.normalize(original_html), self.normalize(v2_html))

    def test_process_template_default_exclude_none(self):
        html, name = tool.process_template(DATA["campaign"], "1")
        self.assertEqual(name, DATA["campaign"].stem)
        self.assertIn(MARKERS["metadata"], html)


# --------------------------------------------------------------------------- #
# 6. Filtros, rutas y archivo embebido
# --------------------------------------------------------------------------- #
class TestHelpers(TempOutputMixin):
    """Filtros Liquid, limpieza de rutas y saneado de nombres."""

    def test_newline_filters(self):
        self.assertEqual(tool.newline_to_br("a\nb\r\nc\\nd"), "a<br>b<br>c<br>d")
        self.assertEqual(tool.strip_newline("a\nb\\nc"), "abc")
        self.assertEqual(tool.newline_to_br(None), "")
        self.assertEqual(tool.strip_newline(None), "")
        self.assertEqual(tool.newline_to_br(42), "42")

    def test_clean_input_path_posix(self):
        self.assertEqual(tool.clean_input_path(r"/tmp/An\ Example\ (1).json", posix=True),
                         Path("/tmp/An Example (1).json"))
        self.assertEqual(tool.clean_input_path("  '/tmp/a b.json'  ", posix=True), Path("/tmp/a b.json"))
        self.assertEqual(tool.clean_input_path("file:///tmp/a%20b.json", posix=True), Path("/tmp/a b.json"))
        self.assertEqual(tool.clean_input_path("", posix=True), Path())

    def test_clean_input_path_windows(self):
        cleaned = tool.clean_input_path(r'"C:\Users\usr\Desktop\An Example.json"', posix=False)
        self.assertEqual(str(cleaned).replace("/", "\\"), r"C:\Users\usr\Desktop\An Example.json")

    def test_embed_file_cannot_escape_output_dir(self):
        import base64
        data = {"file": {"filename": "../../evil",
                         "byte_string": base64.b64encode(b'{"a": 1}').decode()}}
        target = tool.embed_file(data, self.out)
        self.assertEqual(target.parent, self.out)
        self.assertEqual(json.loads(target.read_text()), {"a": 1})
        with self.assertRaises(tool.DataFileError):
            tool.embed_file({"file": {"filename": "x", "byte_string": "@@@"}}, self.out)

    def test_safe_filename(self):
        self.assertEqual(tool._safe_filename('a<b>:c"?.json'), "a_b__c__.json")
        self.assertEqual(tool._safe_filename("../.."), "report")


# --------------------------------------------------------------------------- #
# 7. CLI guiada (entrada simulada)
# --------------------------------------------------------------------------- #
class TestInteractiveCLI(unittest.TestCase):
    """La CLI guiada mantiene el flujo original y acepta varias secciones por línea."""

    def scripted(self, answers):
        it = iter(answers)
        return lambda prompt="": next(it)

    def test_include_flow_intrusion_analysis(self):
        out = io.StringIO()
        escaped = str(DATA["ia"]).replace(" ", "\\ ")
        answers = ["9", "3", "1", "2", "4 5", "abc", "exit", "noexiste.txt", escaped]
        result = tool.cli(input_func=self.scripted(answers),
                          output_func=lambda *a, **k: print(*a, file=out))
        report_type, doc_type, excluded, path = result
        self.assertEqual((report_type, doc_type), ("3", "docx"))
        self.assertNotIn("mitre_attack_table_ia", excluded)
        self.assertNotIn("iocs", excluded)
        self.assertIn("key_points", excluded)
        self.assertEqual(path, DATA["ia"])
        self.assertIn("Choose a valid option", out.getvalue())
        self.assertIn("Intrusion Analysis Report template", out.getvalue())

    def test_prefilled_values_skip_prompts(self):
        answers = ["1", "exit"]  # sólo debe preguntar por las secciones
        result = tool.cli("4", "pdf", None, DATA["ta"], input_func=self.scripted(answers),
                          output_func=lambda *a, **k: None)
        self.assertEqual(result[:2], ["4", "pdf"])
        self.assertEqual(result[2], [])

    def test_exclude_flow(self):
        answers = ["1", "1,7", "exit"]
        excluded = tool.prompt_include_exclude("1", self.scripted(answers), lambda *a, **k: None)
        self.assertEqual(excluded, ["executive_summary", "iocs"])


# --------------------------------------------------------------------------- #
# 8. Preparación para MCP (salida limpia y datos serializables)
# --------------------------------------------------------------------------- #
class TestMCPReadiness(TempOutputMixin):
    """Las funciones públicas no escriben en stdout y devuelven JSON serializable."""

    def test_generate_report_is_silent_and_serializable(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            result = tool.generate_report(str(DATA["campaign"]), "campaign", "docx",
                                          exclude_sections=["iocs"], output_dir=self.out)
        self.assertEqual(stdout.getvalue(), "")
        json.dumps(result)
        self.assertTrue(Path(result["output_path"]).is_file())
        self.assertEqual(result["excluded_sections"], ["iocs"])
        self.assertNotIn("iocs", result["sections"])

    def test_discovery_functions_serializable(self):
        json.dumps(tool.list_report_types())
        for key in DATA:
            sections = tool.list_sections(key)
            json.dumps(sections)
            self.assertEqual(sections[0]["name"], "header")
            self.assertFalse(next(s for s in sections if s["name"] == "feedback")["selectable"])
        json.dumps(tool.check_dependencies())

    def test_report_type_aliases(self):
        for value in (1, "1", "campaign", " Campaign "):
            self.assertEqual(tool.get_report_type(value).key, "campaign")
        self.assertEqual(tool.get_report_type("intrusion_analysis").key, "ia")
        self.assertEqual(tool.get_report_type("threat actor").key, "ta")


# --------------------------------------------------------------------------- #
# 9. Conversor PDF: LibreOffice ausente (simulado)
# --------------------------------------------------------------------------- #
class TestMissingLibreOffice(TempOutputMixin):
    """Sin LibreOffice: alerta con comandos de instalación, sin traceback."""

    def no_engines(self):
        return mock.patch.multiple(dc, find_libreoffice=mock.Mock(return_value=None),
                                   is_word_available=mock.Mock(return_value=False))

    def test_generate_report_pdf_raises_with_install_commands(self):
        with self.no_engines():
            with self.assertRaises(tool.PdfEngineUnavailableError) as ctx:
                tool.generate_report(DATA["campaign"], "1", "pdf", output_dir=self.out)
        message = str(ctx.exception)
        self.assertIn("ALERTA: LibreOffice", message)
        self.assertIn("libreoffice-writer", message)
        self.assertEqual(list(self.out.iterdir()), [])  # falla antes de renderizar

    def test_main_exit_code_3_and_alert_on_stderr(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        with self.no_engines(), contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = tool.main(["-r", "1", "-d", "pdf", "-f", str(DATA["campaign"]),
                              "--output_dir", str(self.out)])
        self.assertEqual(code, 3)
        self.assertIn("Comandos de instalación recomendados", stderr.getvalue())
        self.assertEqual(stdout.getvalue(), "")

    def test_docx_still_works_without_libreoffice(self):
        with self.no_engines():
            result = tool.generate_report(DATA["campaign"], "1", "docx", output_dir=self.out)
        self.assertTrue(Path(result["output_path"]).is_file())

    def test_check_libreoffice_warns(self):
        with self.no_engines(), self.assertLogs("document_converter", "WARNING") as logs:
            status = dc.check_libreoffice(warn=True)
        self.assertFalse(status.available)
        self.assertIn("ALERTA", logs.output[0])

    def test_word_fallback_selected_on_windows(self):
        with mock.patch.object(dc, "find_libreoffice", return_value=None), \
                mock.patch.object(dc, "is_word_available", return_value=True):
            self.assertEqual(dc.resolve_pdf_engine("auto", system="Windows"), "word")
        with mock.patch.object(dc, "find_libreoffice", return_value=["soffice"]):
            self.assertEqual(dc.resolve_pdf_engine("auto", system="Windows"), "libreoffice")
        with self.assertRaises(ValueError):
            dc.resolve_pdf_engine("pandoc")  # type: ignore[arg-type]

    def test_libreoffice_path_env_var(self):
        fake = self.out / "soffice"
        fake.write_text("")
        with mock.patch.dict(os.environ, {dc.LIBREOFFICE_ENV_VAR: str(fake)}):
            self.assertEqual(dc.find_libreoffice(), [str(fake)])

    def test_windows_candidate_paths(self):
        with mock.patch.dict(os.environ, {"ProgramFiles": r"C:\Program Files"}):
            paths = [str(p).replace("/", "\\") for p in dc._candidate_paths("Windows")]
        self.assertIn(r"C:\Program Files\LibreOffice\program\soffice.exe", paths)


# --------------------------------------------------------------------------- #
# 10. Comandos de instalación por sistema / distribución / versión
# --------------------------------------------------------------------------- #
class TestInstallInstructions(unittest.TestCase):
    """La alerta debe proponer el gestor y paquete correctos según la distro y versión."""

    def linux(self, **os_release):
        return dc.get_install_instructions("Linux", os_release)

    def test_ubuntu_versions(self):
        modern = self.linux(ID="ubuntu", ID_LIKE="debian", VERSION_ID="26.04",
                            PRETTY_NAME="Ubuntu 26.04.1 LTS")
        self.assertEqual(modern.package_manager, "apt")
        self.assertIn("sudo apt install -y libreoffice-writer", modern.commands)
        self.assertTrue(any("nogui" in a for a in modern.alternatives))
        self.assertTrue(any("snap" in a for a in modern.alternatives))
        focal = self.linux(ID="ubuntu", VERSION_ID="20.04")
        self.assertFalse(any("nogui" in a for a in focal.alternatives))
        trusty = self.linux(ID="ubuntu", VERSION_ID="14.04")
        self.assertEqual(trusty.package_manager, "apt-get")
        self.assertTrue(any("fuera de soporte" in n for n in trusty.notes))

    def test_debian_and_derivatives(self):
        self.assertTrue(any("nogui" in a for a in self.linux(ID="debian", VERSION_ID="12").alternatives))
        self.assertEqual(self.linux(ID="debian", VERSION_ID="8").package_manager, "apt-get")
        mint = self.linux(ID="linuxmint", ID_LIKE="ubuntu debian", VERSION_ID="22")
        self.assertEqual(mint.package_manager, "apt")
        kali = self.linux(ID="kali", ID_LIKE="debian", VERSION_ID="2026.3")
        self.assertIn("sudo apt install -y libreoffice-writer", kali.commands)

    def test_red_hat_family_versions(self):
        self.assertEqual(self.linux(ID="fedora", VERSION_ID="42").commands,
                         ["sudo dnf install -y libreoffice-writer"])
        self.assertEqual(self.linux(ID="centos", VERSION_ID="7").package_manager, "yum")
        self.assertEqual(self.linux(ID="rocky", ID_LIKE="rhel centos fedora",
                                    VERSION_ID="8.10").package_manager, "dnf")
        rhel9 = self.linux(ID="rhel", VERSION_ID="9.6")
        self.assertTrue(any("deprecated" in n for n in rhel9.notes))
        alma10 = self.linux(ID="almalinux", ID_LIKE="rhel centos fedora", VERSION_ID="10.0")
        self.assertEqual(alma10.package_manager, "flatpak")
        self.assertTrue(any("flathub" in c for c in alma10.commands))

    def test_other_distributions(self):
        cases = {
            "opensuse-tumbleweed": "zypper", "sles": "zypper", "arch": "pacman",
            "manjaro": "pacman", "alpine": "apk", "gentoo": "emerge", "void": "xbps",
            "nixos": "nix",
        }
        for distro, pm in cases.items():
            with self.subTest(distro=distro):
                self.assertEqual(self.linux(ID=distro).package_manager, pm)
        unknown = self.linux(ID="weirdos")
        self.assertIsNone(unknown.package_manager)
        self.assertTrue(any("flatpak" in c for c in unknown.commands))

    def test_windows_and_macos(self):
        win = dc.get_install_instructions("Windows")
        self.assertIn("winget install -e --id TheDocumentFoundation.LibreOffice", win.commands)
        self.assertTrue(any("choco" in a for a in win.alternatives))
        mac = dc.get_install_instructions("Darwin")
        self.assertEqual(mac.commands, ["brew install --cask libreoffice"])

    def test_read_os_release(self):
        with tempfile.NamedTemporaryFile("w", suffix="os-release", delete=False) as fh:
            fh.write('# comentario\nID=ubuntu\nVERSION_ID="22.04"\nPRETTY_NAME=\'Ubuntu 22.04\'\n')
        try:
            info = dc.read_os_release(fh.name)
        finally:
            os.unlink(fh.name)
        self.assertEqual(info, {"ID": "ubuntu", "VERSION_ID": "22.04", "PRETTY_NAME": "Ubuntu 22.04"})
        self.assertEqual(dc.read_os_release("/no/existe"), {})

    def test_message_is_complete(self):
        message = dc.format_install_message(self.linux(ID="fedora", VERSION_ID="42",
                                                       PRETTY_NAME="Fedora Linux 42"))
        for fragment in ("ALERTA", "Fedora Linux 42", "sudo dnf install", "LIBREOFFICE_PATH"):
            self.assertIn(fragment, message)


# --------------------------------------------------------------------------- #
# 11. Conversor PDF real y su CLI
# --------------------------------------------------------------------------- #
class TestConverterCLI(TempOutputMixin):
    """CLI de ``document_converter`` y conversión directa."""

    def run_converter(self, *args):
        return subprocess.run([PYTHON, str(PROJECT_DIR / "document_converter.py"), *args],
                              capture_output=True, text=True, timeout=300)

    def test_check(self):
        result = self.run_converter("--check")
        self.assertEqual(result.returncode, 0 if LIBREOFFICE else 3, result.stderr)

    def test_missing_docx(self):
        result = self.run_converter(str(self.out / "nada.docx"))
        self.assertEqual(result.returncode, 1)
        self.assertIn("No existe el archivo DOCX", result.stderr)

    @unittest.skipUnless(LIBREOFFICE, "LibreOffice no instalado")
    def test_convert_to_directory_and_explicit_path(self):
        docx = tool.export_report("<html><body><h2>Hola</h2><p>Mundo</p></body></html>",
                                  "prueba", "docx", self.out)
        sub = self.out / "pdfs"
        sub.mkdir()
        self.assertEqual(dc.convert_docx_to_pdf(docx, sub), sub / "prueba.pdf")
        explicit = dc.convert_docx_to_pdf(docx, self.out / "otro nombre.pdf", engine="libreoffice")
        self.assertEqual(explicit.read_bytes()[:5], b"%PDF-")
        self.assertEqual(dc.convert_docx_to_pdf(docx), self.out / "prueba.pdf")

    @unittest.skipUnless(LIBREOFFICE, "LibreOffice no instalado")
    def test_conversion_failure_reported(self):
        broken = self.out / "roto.docx"
        broken.write_bytes(b"esto no es un docx")
        with self.assertRaises(dc.ConversionError):
            dc.convert_docx_to_pdf(broken, timeout=120)


if __name__ == "__main__":
    unittest.main(verbosity=2)
