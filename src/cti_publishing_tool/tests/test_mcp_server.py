"""Tests funcionales del MCP Server (``cti_mcp_server``).

Se usa el cliente oficial del SDK de MCP:

* En memoria (``Client(server)``) para probar cada herramienta.
* Por stdio (``Client(StdioServerParameters)``) lanzando el servidor como
  subproceso, igual que lo haría Claude Code, para verificar que el protocolo
  no se contamina con salida en ``stdout``.

Cada test usa directorios de datos, plantillas y salida temporales.

Ejecutar desde la raíz del proyecto::

    create_report/bin/python -m unittest discover -s tests -v
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

from mcp import Client  # noqa: E402
from mcp.client.stdio import StdioServerParameters  # noqa: E402

import cti_mcp_server as srv  # noqa: E402
import cti_publishing_tool_v2 as tool  # noqa: E402
import document_converter as dc  # noqa: E402

import docx  # noqa: E402

DATA_DIR = PROJECT_DIR / "data"
CTID_DIR = tool.CTID_TEMPLATES_DIR
CAMPAIGN = "An Example Campaign Report.json"
IA = "An Example Intrusion Analysis Report.json"
LIBREOFFICE = dc.find_libreoffice()

EXPECTED_TOOLS = {"list_report_types", "list_sections", "list_input_files", "preview_report_html",
                  "generate_report", "inspect_docx_template", "check_dependencies"}
READ_ONLY_TOOLS = EXPECTED_TOOLS - {"generate_report"}


class MCPTestCase(unittest.IsolatedAsyncioTestCase):
    """Crea directorios temporales (datos, plantillas, salida) y un servidor en memoria."""

    async def asyncSetUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory(prefix="cti_mcp_test_")
        root = Path(self._tmp.name)
        self.data_dir, self.template_dir, self.out = root / "data", root / "templates", root / "out"
        self.outside = root / "outside"
        for directory in (self.data_dir, self.template_dir, self.outside):
            directory.mkdir()
        for name in (CAMPAIGN, IA):
            shutil.copy(DATA_DIR / name, self.data_dir / name)
        (self.data_dir / "sub").mkdir()
        shutil.copy(DATA_DIR / CAMPAIGN, self.data_dir / "sub" / "nested.json")
        for template in CTID_DIR.glob("*.docx"):
            shutil.copy(template, self.template_dir / template.name)

        env_patch = mock.patch.dict(os.environ)
        env_patch.start()
        os.environ.pop(tool.DOCX_TEMPLATE_ENV_VAR, None)
        self.addCleanup(env_patch.stop)

        self.config = srv.ServerConfig(
            data_dirs=(self.data_dir.resolve(),),
            template_dirs=(self.template_dir.resolve(),),
            output_dir=self.out.resolve(),
        )
        self.server = srv.create_server(self.config)

    async def asyncTearDown(self) -> None:
        self._tmp.cleanup()

    # El cliente (anyio) debe abrirse y cerrarse en la misma tarea; IsolatedAsyncioTestCase
    # ejecuta setUp/test/tearDown en tareas distintas, así que se conecta en cada llamada.
    async def call(self, name: str, server=None, **arguments):
        """Conecta un cliente en memoria, llama a una herramienta y devuelve el ``CallToolResult``."""
        async with Client(server or self.server) as client:
            return await client.call_tool(name, arguments)

    async def tools(self) -> dict:
        """Devuelve las herramientas publicadas por el servidor, por nombre."""
        async with Client(self.server) as client:
            return {t.name: t for t in (await client.list_tools()).tools}

    async def call_ok(self, name: str, **arguments):
        """Llama a una herramienta, exige éxito y devuelve el contenido estructurado."""
        result = await self.call(name, **arguments)
        self.assertFalse(result.is_error, result.content[0].text if result.content else result)
        content = result.structured_content
        return content["result"] if set(content) == {"result"} else content

    async def call_error(self, name: str, **arguments) -> str:
        """Llama a una herramienta, exige error y devuelve el mensaje."""
        result = await self.call(name, **arguments)
        self.assertTrue(result.is_error, f"{name} debía fallar: {result.structured_content}")
        return result.content[0].text


# --------------------------------------------------------------------------- #
# 1. Descubrimiento de herramientas
# --------------------------------------------------------------------------- #
class TestToolCatalog(MCPTestCase):
    """Catálogo, descripciones, esquemas y anotaciones de las herramientas."""

    async def test_tools_listed_with_descriptions(self):
        tools = await self.tools()
        self.assertEqual(set(tools), EXPECTED_TOOLS)
        for name, item in tools.items():
            with self.subTest(tool=name):
                self.assertTrue(item.description and len(item.description) > 30)
                self.assertTrue(item.title)

    async def test_annotations(self):
        tools = await self.tools()
        for name in READ_ONLY_TOOLS:
            self.assertTrue(tools[name].annotations.read_only_hint, name)
        generate = tools["generate_report"].annotations
        self.assertFalse(generate.read_only_hint)
        self.assertTrue(generate.destructive_hint)  # sobrescribe salidas con el mismo nombre
        self.assertFalse(generate.open_world_hint)

    async def test_input_schema_enums_and_descriptions(self):
        tools = await self.tools()
        props = tools["generate_report"].input_schema["properties"]
        self.assertEqual(props["report_type"]["enum"], ["campaign", "executive", "ia", "ta"])
        self.assertEqual(props["document_type"]["enum"], ["docx", "pdf", "html"])
        for name, prop in props.items():
            self.assertTrue(prop.get("description"), f"{name} sin descripción")
        self.assertEqual(tools["generate_report"].input_schema["required"], ["report_type"])

    async def test_instructions(self):
        async with Client(self.server) as client:
            self.assertIn("generate_report", client.instructions)

    async def test_invalid_enum_rejected(self):
        message = await self.call_error("list_sections", report_type="9")
        self.assertIn("report_type", message)


# --------------------------------------------------------------------------- #
# 2. Herramientas de consulta
# --------------------------------------------------------------------------- #
class TestReadTools(MCPTestCase):
    """list_report_types, list_sections, list_input_files, check_dependencies."""

    async def test_list_report_types(self):
        types = await self.call_ok("list_report_types")
        self.assertEqual([t["key"] for t in types], ["campaign", "executive", "ia", "ta"])

    async def test_list_sections(self):
        sections = await self.call_ok("list_sections", report_type="ia")
        names = [s["name"] for s in sections]
        self.assertIn("mitre_attack_table_ia", names)
        self.assertEqual(names[0], "header")

    async def test_list_input_files(self):
        listing = await self.call_ok("list_input_files")
        data_names = {f["name"] for f in listing["data_files"]}
        self.assertEqual(data_names, {CAMPAIGN, IA, "sub/nested.json"})
        self.assertEqual(len(listing["docx_templates"]), 4)
        self.assertEqual(listing["output_dir"], str(self.out.resolve()))
        self.assertIsNone(listing["default_docx_template"])

    async def test_list_input_files_skips_symlinks_outside_and_hidden(self):
        secret = self.outside / "secret.json"
        secret.write_text("{}")
        (self.data_dir / "link.json").symlink_to(secret)
        (self.data_dir / ".hidden.json").write_text("{}")
        names = {f["name"] for f in (await self.call_ok("list_input_files"))["data_files"]}
        self.assertNotIn("link.json", names)
        self.assertNotIn(".hidden.json", names)

    async def test_check_dependencies(self):
        deps = await self.call_ok("check_dependencies")
        self.assertEqual(deps["pdf_available"], bool(LIBREOFFICE) or deps["libreoffice"]["word_available"])
        self.assertEqual(deps["server"]["output_dir"], str(self.out.resolve()))
        self.assertEqual(deps["missing_templates"], [])

    async def test_check_dependencies_without_libreoffice(self):
        with mock.patch.object(dc, "find_libreoffice", return_value=None):
            deps = await self.call_ok("check_dependencies")
        self.assertFalse(deps["libreoffice"]["available"])
        self.assertIn("Comandos de instalación", deps["install_message"])


# --------------------------------------------------------------------------- #
# 3. Vista previa
# --------------------------------------------------------------------------- #
class TestPreview(MCPTestCase):
    """preview_report_html no escribe archivos y respeta secciones y límites."""

    async def test_preview_from_file(self):
        preview = await self.call_ok("preview_report_html", report_type="campaign", data_file=CAMPAIGN)
        self.assertIn("<h2>Executive Summary</h2>", preview["html"])
        self.assertFalse(preview["truncated"])
        self.assertEqual(preview["total_chars"], len(preview["html"]))
        self.assertFalse(self.out.exists())

    async def test_preview_only_sections_with_generic_name(self):
        preview = await self.call_ok("preview_report_html", report_type="ia", data_file=IA,
                                     only_sections=["mitre_attack_table"])
        self.assertIn("mitre_attack_table_ia", preview["sections"])
        self.assertNotIn("key_points", preview["sections"])

    async def test_preview_truncation(self):
        preview = await self.call_ok("preview_report_html", report_type="ta", data_file=CAMPAIGN,
                                     max_chars=1000)
        self.assertTrue(preview["truncated"])
        self.assertEqual(len(preview["html"]), 1000)
        await self.call_error("preview_report_html", report_type="ta", data_file=CAMPAIGN, max_chars=5)

    async def test_preview_inline_data(self):
        data = json.loads((DATA_DIR / CAMPAIGN).read_text())
        data["report_title"] = "Informe creado por el LLM"
        preview = await self.call_ok("preview_report_html", report_type="campaign", report_data=data)
        self.assertIn("Informe creado por el LLM", preview["html"])

    async def test_preview_invalid_section_is_reported(self):
        message = await self.call_error("preview_report_html", report_type="executive",
                                        data_file=CAMPAIGN, exclude_sections=["victims"])
        self.assertIn("victims", message)


# --------------------------------------------------------------------------- #
# 4. Generación de documentos
# --------------------------------------------------------------------------- #
class TestGenerate(MCPTestCase):
    """generate_report en todos los formatos, con datos en línea y plantillas."""

    async def test_generate_docx_from_file(self):
        result = await self.call_ok("generate_report", report_type="campaign", data_file=CAMPAIGN)
        path = Path(result["output_path"])
        self.assertEqual(path, self.out.resolve() / "An Example Campaign Report.docx")
        self.assertTrue(path.is_file())
        self.assertIn("Key Points", "\n".join(p.text for p in docx.Document(str(path)).paragraphs))

    async def test_generate_html_nested_file(self):
        result = await self.call_ok("generate_report", report_type="campaign", document_type="html",
                                    data_file="sub/nested.json")
        self.assertTrue(result["output_path"].endswith("nested.html"))

    async def test_generate_absolute_path_inside_allowed_dir(self):
        result = await self.call_ok("generate_report", report_type="ia",
                                    data_file=str(self.data_dir / IA))
        self.assertTrue(Path(result["output_path"]).is_file())

    @unittest.skipUnless(LIBREOFFICE, "LibreOffice no instalado")
    async def test_generate_pdf_with_corporate_template(self):
        result = await self.call_ok("generate_report", report_type="ia", document_type="pdf",
                                    data_file=IA, docx_template="CTID-IAReportTemplate.docx",
                                    only_sections=["mitre_attack_table", "iocs"])
        pdf = Path(result["output_path"])
        self.assertEqual(pdf.read_bytes()[:5], b"%PDF-")
        self.assertEqual(result["docx_template"], str((self.template_dir / "CTID-IAReportTemplate.docx").resolve()))
        self.assertIn("mitre_attack_table_ia", result["sections"])
        # Sólo se añaden los estilos que el informe usa: estas secciones tienen tablas, no listas.
        self.assertIn("Light List Accent 1", result["template_styles_added"])
        self.assertNotIn("List Bullet", result["template_styles_added"])

    async def test_generate_inline_data_with_output_name(self):
        data = json.loads((DATA_DIR / CAMPAIGN).read_text())
        result = await self.call_ok("generate_report", report_type="campaign", report_data=data,
                                    output_name="Informe semanal 46")
        self.assertEqual(Path(result["output_path"]).name, "Informe semanal 46.docx")

    async def test_inline_data_default_name_is_title(self):
        data = json.loads((DATA_DIR / CAMPAIGN).read_text())
        data["report_title"] = "APT/Prueba: fase 1"
        result = await self.call_ok("generate_report", report_type="campaign", report_data=data)
        path = Path(result["output_path"])
        self.assertEqual(path.parent, self.out.resolve())  # la "/" del título no crea carpetas
        self.assertTrue(path.is_file())

    async def test_output_name_cannot_escape_output_dir(self):
        for name in ("../../evil", "/etc/evil", "..\\..\\evil", "sub/evil"):
            with self.subTest(name=name):
                result = await self.call_ok("generate_report", report_type="executive", data_file=CAMPAIGN,
                                            output_name=name)
                self.assertEqual(Path(result["output_path"]).parent, self.out.resolve())
        self.assertEqual(list(self.outside.iterdir()), [])

    async def test_data_source_rules(self):
        message = await self.call_error("generate_report", report_type="campaign")
        self.assertIn("exactly one", message)
        data = json.loads((DATA_DIR / CAMPAIGN).read_text())
        await self.call_error("generate_report", report_type="campaign", data_file=CAMPAIGN, report_data=data)

    async def test_inline_data_size_limit(self):
        small = srv.create_server(srv.ServerConfig(
            self.config.data_dirs, self.config.template_dirs, self.config.output_dir, max_inline_bytes=100))
        result = await self.call("generate_report", server=small, report_type="campaign",
                                 report_data={"report_title": "x" * 200})
        self.assertTrue(result.is_error)
        self.assertIn("too large", result.content[0].text)

    async def test_exclude_and_only_exclusive(self):
        await self.call_error("generate_report", report_type="campaign", data_file=CAMPAIGN,
                              exclude_sections=["iocs"], only_sections=["key_points"])

    async def test_invalid_table_style_message(self):
        message = await self.call_error("generate_report", report_type="campaign", data_file=CAMPAIGN,
                                        docx_template="CTID-CampaignReportTemplate.docx", table_style="Nope")
        self.assertIn("Table style 'Nope' not found", message)

    async def test_default_template_from_env(self):
        template = self.template_dir / "CTID-TAReportTemplate.docx"
        with mock.patch.dict(os.environ, {tool.DOCX_TEMPLATE_ENV_VAR: str(template)}):
            result = await self.call_ok("generate_report", report_type="ta", data_file=CAMPAIGN)
            listing = await self.call_ok("list_input_files")
        self.assertEqual(result["docx_template"], str(template.resolve()))
        self.assertEqual(listing["default_docx_template"], str(template.resolve()))

    async def test_pdf_without_libreoffice_returns_install_commands(self):
        with mock.patch.object(dc, "find_libreoffice", return_value=None), \
                mock.patch.object(dc, "is_word_available", return_value=False):
            message = await self.call_error("generate_report", report_type="campaign",
                                            document_type="pdf", data_file=CAMPAIGN)
        self.assertIn("ALERTA: LibreOffice", message)
        self.assertIn("Comandos de instalación", message)
        self.assertFalse(self.out.exists())


# --------------------------------------------------------------------------- #
# 5. Seguridad de rutas
# --------------------------------------------------------------------------- #
class TestPathSecurity(MCPTestCase):
    """Sólo se leen archivos dentro de los directorios permitidos."""

    async def test_traversal_and_absolute_paths_rejected(self):
        secret = self.outside / "secret.json"
        secret.write_text(json.dumps({"report_title": "SECRETO"}))
        for value in ("../outside/secret.json", str(secret), "sub/../../outside/secret.json"):
            with self.subTest(value=value):
                message = await self.call_error("generate_report", report_type="campaign", data_file=value)
                self.assertIn("outside the allowed directories", message)
                await self.call_error("preview_report_html", report_type="campaign", data_file=value)

    async def test_symlink_pointing_outside_rejected(self):
        secret = self.outside / "secret.json"
        secret.write_text(json.dumps({"report_title": "SECRETO"}))
        (self.data_dir / "link.json").symlink_to(secret)
        message = await self.call_error("preview_report_html", report_type="campaign", data_file="link.json")
        self.assertIn("outside the allowed directories", message)

    async def test_wrong_extension_and_missing_files(self):
        message = await self.call_error("generate_report", report_type="campaign", data_file="/etc/passwd")
        self.assertIn("extension", message)
        message = await self.call_error("generate_report", report_type="campaign", data_file="nada.json")
        self.assertIn("not found", message)
        await self.call_error("generate_report", report_type="campaign", data_file="")

    async def test_template_must_be_in_template_dirs(self):
        rogue = self.outside / "rogue.docx"
        shutil.copy(CTID_DIR / "CTID-CampaignReportTemplate.docx", rogue)
        message = await self.call_error("generate_report", report_type="campaign", data_file=CAMPAIGN,
                                        docx_template=str(rogue))
        self.assertIn("outside the allowed directories", message)
        await self.call_error("inspect_docx_template", template=str(rogue))
        # Un JSON de datos no sirve como plantilla, aunque esté en un directorio permitido.
        await self.call_error("inspect_docx_template", template=CAMPAIGN)

    async def test_corrupt_template_reported(self):
        (self.template_dir / "roto.docx").write_bytes(b"no es docx")
        message = await self.call_error("inspect_docx_template", template="roto.docx")
        self.assertIn("Not a valid Word", message)

    async def test_inspect_template(self):
        info = await self.call_ok("inspect_docx_template", template="CTID-CampaignReportTemplate.docx")
        self.assertEqual(info["mode"], "clear_body")
        self.assertGreater(info["header_footer_images"], 0)

    async def test_unexpected_errors_hide_details(self):
        with mock.patch.object(tool, "list_report_types", side_effect=RuntimeError("detalle interno")):
            result = await self.call("list_report_types")
        self.assertTrue(result.is_error)
        self.assertNotIn("detalle interno", result.content[0].text)


# --------------------------------------------------------------------------- #
# 6. Configuración y transporte stdio
# --------------------------------------------------------------------------- #
class TestConfigAndStdio(unittest.IsolatedAsyncioTestCase):
    """Configuración desde el entorno y servidor real lanzado por stdio."""

    def test_config_from_env(self):
        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp) / "a", Path(tmp) / "b"
            env = {srv.ENV_DATA_DIRS: f"{first}{os.pathsep}{second}", srv.ENV_OUTPUT_DIR: str(Path(tmp) / "o")}
            config = srv.ServerConfig.from_env(env)
        self.assertEqual(config.data_dirs, (first.resolve(), second.resolve()))
        self.assertEqual(config.template_dirs, (tool.CTID_TEMPLATES_DIR.resolve(),))
        self.assertEqual(config.output_dir, (Path(tmp) / "o").resolve())
        default = srv.ServerConfig.from_env({})
        self.assertEqual(default.data_dirs, ((PROJECT_DIR / "data").resolve(),))
        self.assertEqual(default.output_dir, tool.DEFAULT_OUTPUT_DIR.resolve())

    def test_module_documented(self):
        import inspect
        self.assertTrue(inspect.getdoc(srv))
        # Se excluyen los dunder: Python 3.14 (PEP 649) genera __annotate__ automáticamente.
        missing = [name for name, obj in vars(srv).items()
                   if not name.startswith("__")
                   and (inspect.isfunction(obj) or inspect.isclass(obj))
                   and getattr(obj, "__module__", None) == srv.__name__ and not obj.__doc__]
        self.assertEqual(missing, [])

    def test_print_config(self):
        import subprocess
        result = subprocess.run([sys.executable, str(PROJECT_DIR / "cti_mcp_server.py"), "--print-config"],
                                capture_output=True, text=True, timeout=60, cwd="/")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("output_dir", json.loads(result.stdout))

    async def test_stdio_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, srv.ENV_OUTPUT_DIR: tmp}
            env.pop(tool.DOCX_TEMPLATE_ENV_VAR, None)
            params = StdioServerParameters(command=sys.executable,
                                           args=[str(PROJECT_DIR / "cti_mcp_server.py")],
                                           env=env, cwd="/")
            async with Client(params, read_timeout_seconds=120) as client:
                tools = {t.name for t in (await client.list_tools()).tools}
                self.assertEqual(tools, EXPECTED_TOOLS)
                result = await client.call_tool("generate_report", {
                    "report_type": "campaign", "data_file": CAMPAIGN,
                    "docx_template": "CTID-CampaignReportTemplate.docx"})
                self.assertFalse(result.is_error, result.content)
                output = Path(result.structured_content["output_path"])
                self.assertTrue(output.is_file())
                self.assertEqual(output.parent, Path(tmp).resolve())
                bad = await client.call_tool("generate_report", {"report_type": "campaign",
                                                                  "data_file": "/etc/passwd.json"})
                self.assertTrue(bad.is_error)


if __name__ == "__main__":
    unittest.main(verbosity=2)
