"""Tests funcionales de las plantillas DOCX corporativas de ``cti_publishing_tool_v2``.

Cada test construye una plantilla corporativa de prueba (encabezado con logo,
pie, fuente, márgenes, estilos propios) en un directorio temporal, genera el
informe sobre ella y verifica el resultado abriendo el DOCX/PDF generado.

Ejecutar desde la raíz del proyecto::

    create_report/bin/python -m unittest discover -s tests -v
"""

from __future__ import annotations

import base64
import contextlib
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import warnings
import zipfile
from pathlib import Path
from unittest import mock

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

import cti_publishing_tool_v2 as tool  # noqa: E402
import document_converter as dc  # noqa: E402

import docx  # noqa: E402
from docx.enum.style import WD_STYLE_TYPE  # noqa: E402
from docx.oxml.ns import qn  # noqa: E402
from docx.shared import Cm, Pt, RGBColor  # noqa: E402

PYTHON = sys.executable
SCRIPT = PROJECT_DIR / "cti_publishing_tool_v2.py"
DATA = {
    "campaign": PROJECT_DIR / "data" / "An Example Campaign Report.json",
    "executive": PROJECT_DIR / "data" / "An Example Executive Report.json",
    "ia": PROJECT_DIR / "data" / "An Example Intrusion Analysis Report.json",
    "ta": PROJECT_DIR / "data" / "An Example Threat Actor Report.json",
}
CTID_TEMPLATES = {
    "campaign": tool.CTID_TEMPLATES_DIR / "CTID-CampaignReportTemplate.docx",
    "executive": tool.CTID_TEMPLATES_DIR / "CTID-ExecutiveReportTemplate.docx",
    "ia": tool.CTID_TEMPLATES_DIR / "CTID-IAReportTemplate.docx",
    "ta": tool.CTID_TEMPLATES_DIR / "CTID-TAReportTemplate.docx",
}
LIBREOFFICE = dc.find_libreoffice()
PDFTOTEXT = shutil.which("pdftotext")

#: PNG de 1x1 píxel usado como "logo" corporativo.
LOGO_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
HEADER_TEXT = "ACME Corp - Threat Intelligence - TLP:AMBER"
FOOTER_TEXT = "Confidencial - uso interno ACME"
SAMPLE_BODY_TEXT = "Texto de ejemplo de la plantilla"
DROPPED_STYLES = ("List Bullet", "List Number", "Heading 3", "Light List Accent 1")
DOTX_CT = b"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml"
DOCX_CT = b"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"


# --------------------------------------------------------------------------- #
# Construcción de plantillas de prueba
# --------------------------------------------------------------------------- #
def _rewrite_zip(path: Path, transform) -> None:
    """Reescribe un paquete OOXML aplicando ``transform(nombre, bytes) -> bytes | None``."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(path) as src, zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = transform(item.filename, src.read(item.filename))
            if data is not None:
                dst.writestr(item, data)
    path.write_bytes(buffer.getvalue())


def build_template(path: Path, *, marker: bool = False, cover: bool = False, dotx: bool = False,
                   no_numbering: bool = False, sample_text: bool = True) -> Path:
    """Crea una plantilla corporativa de prueba.

    Incluye encabezado con logo y texto, pie, fuente Arial 11, márgenes y
    página A4 propios, un ``Heading 2`` corporativo (Georgia, color propio) y
    un estilo de tabla ``ACME Table``. Se eliminan los estilos de
    :data:`DROPPED_STYLES` para simular una plantilla incompleta, y la lista
    ``numId=1`` se convierte en numérica para detectar colisiones de numeración.
    """
    document = docx.Document()
    section = document.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.left_margin = section.right_margin = Cm(1.8)
    section.top_margin, section.bottom_margin = Cm(3.2), Cm(2.1)
    header_paragraph = section.header.paragraphs[0]
    header_paragraph.add_run().add_picture(io.BytesIO(LOGO_PNG), width=Cm(1))
    header_paragraph.add_run(" " + HEADER_TEXT)
    section.footer.paragraphs[0].text = FOOTER_TEXT

    normal = document.styles["Normal"]
    normal.font.name, normal.font.size = "Arial", Pt(11)
    heading2 = document.styles["Heading 2"]
    heading2.font.name, heading2.font.color.rgb = "Georgia", RGBColor(0x8B, 0x00, 0x00)
    document.styles.add_style("ACME Table", WD_STYLE_TYPE.TABLE)

    for name in DROPPED_STYLES:
        document.styles.element.remove(document.styles[name].element)
    # numId=1 pasa a ser numérica: si el código reutilizara ese numId, las viñetas saldrían numeradas.
    numbering = document.part.numbering_part.element
    num1 = next(n for n in numbering.findall(qn("w:num")) if n.get(qn("w:numId")) == "1")
    abstract_id = num1.find(qn("w:abstractNumId")).get(qn("w:val"))
    abstract = next(a for a in numbering.findall(qn("w:abstractNum"))
                    if a.get(qn("w:abstractNumId")) == abstract_id)
    for fmt in abstract.iter(qn("w:numFmt")):
        fmt.set(qn("w:val"), "decimal")

    body_paragraph = document.paragraphs[0] if document.paragraphs else document.add_paragraph()
    body_paragraph.text = SAMPLE_BODY_TEXT if sample_text else ""
    if cover:
        body_paragraph.text = "PORTADA ACME"
    if marker:
        document.add_paragraph(tool.CONTENT_MARKER)
    if cover:
        document.add_paragraph("AVISO LEGAL ACME")
    document.save(str(path))

    if no_numbering:
        def strip(name, data):
            if name == "word/numbering.xml":
                return None
            if name == "word/_rels/document.xml.rels":
                return re.sub(rb'<Relationship[^>]*numbering\.xml"[^>]*/>', b"", data)
            if name == "[Content_Types].xml":
                return re.sub(rb'<Override[^>]*numbering\.xml"[^>]*/>', b"", data)
            return data
        _rewrite_zip(path, strip)
    if dotx:
        _rewrite_zip(path, lambda name, data: data.replace(DOCX_CT, DOTX_CT)
                     if name == "[Content_Types].xml" else data)
        new_path = path.with_suffix(".dotx")
        path.rename(new_path)
        return new_path
    return path


# --------------------------------------------------------------------------- #
# Utilidades de verificación
# --------------------------------------------------------------------------- #
def body_texts(document) -> list[str]:
    """Textos no vacíos de los párrafos del cuerpo, en orden."""
    return [p.text for p in document.paragraphs if p.text.strip()]


def header_footer_xml(document) -> str:
    """XML concatenado de encabezados y pies de todas las secciones."""
    return "".join(s.header._element.xml + s.footer._element.xml for s in document.sections)


def list_format(document, style_name: str) -> str:
    """Formato de nivel 0 (``bullet``, ``decimal``...) de la numeración de un estilo de lista."""
    style = document.styles[style_name]
    num_id = style.element.find(qn("w:pPr")).find(qn("w:numPr")).find(qn("w:numId")).get(qn("w:val"))
    numbering = document.part.numbering_part.element
    num = next(n for n in numbering.findall(qn("w:num")) if n.get(qn("w:numId")) == num_id)
    abstract_id = num.find(qn("w:abstractNumId")).get(qn("w:val"))
    abstract = next(a for a in numbering.findall(qn("w:abstractNum"))
                    if a.get(qn("w:abstractNumId")) == abstract_id)
    level0 = next(l for l in abstract.findall(qn("w:lvl")) if l.get(qn("w:ilvl")) == "0")
    return level0.find(qn("w:numFmt")).get(qn("w:val"))


def run_cli(*args: str, env: dict | None = None) -> subprocess.CompletedProcess:
    """Ejecuta el script v2 como proceso independiente."""
    return subprocess.run([PYTHON, str(SCRIPT), *args], cwd=str(PROJECT_DIR), capture_output=True,
                          text=True, timeout=300, stdin=subprocess.DEVNULL,
                          env=env or {k: v for k, v in os.environ.items() if k != tool.DOCX_TEMPLATE_ENV_VAR})


class TemplateTestCase(unittest.TestCase):
    """Directorio temporal por test y entorno sin plantilla por defecto."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory(prefix="cti_tpl_test_")
        self.dir = Path(self._tmp.name)
        self.out = self.dir / "out"
        env_patch = mock.patch.dict(os.environ)
        env_patch.start()
        os.environ.pop(tool.DOCX_TEMPLATE_ENV_VAR, None)
        self.addCleanup(env_patch.stop)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def generate(self, template, key="campaign", **kwargs) -> tuple[dict, docx.document.Document]:
        """Genera el informe con la plantilla y devuelve (resultado, documento abierto)."""
        kwargs.setdefault("document_type", "docx")
        result = tool.generate_report(DATA[key], key, output_dir=self.out, docx_template=template, **kwargs)
        opened = docx.Document(result["output_path"]) if result["document_type"] == "docx" else None
        return result, opened


# --------------------------------------------------------------------------- #
# 1. Plantilla en blanco: se conserva el formato corporativo
# --------------------------------------------------------------------------- #
class TestBlankCorporateTemplate(TemplateTestCase):
    """Encabezado, pie, logo, página, fuentes y estilos de la plantilla se conservan."""

    def setUp(self) -> None:
        super().setUp()
        self.template = build_template(self.dir / "acme.docx")
        with self.assertLogs("cti_publishing_tool", "WARNING") as self.logs:
            self.result, self.doc = self.generate(self.template)

    def test_header_footer_and_logo_preserved(self):
        xml = header_footer_xml(self.doc)
        self.assertIn(HEADER_TEXT, xml)
        self.assertIn(FOOTER_TEXT, xml)
        self.assertIn("<w:drawing", xml)

    def test_page_setup_preserved(self):
        section = self.doc.sections[-1]
        self.assertAlmostEqual(section.page_width.cm, 21, places=1)
        self.assertAlmostEqual(section.page_height.cm, 29.7, places=1)
        self.assertAlmostEqual(section.left_margin.cm, 1.8, places=1)
        self.assertAlmostEqual(section.top_margin.cm, 3.2, places=1)

    def test_corporate_styles_win(self):
        self.assertEqual(self.doc.styles["Normal"].font.name, "Arial")
        heading2 = self.doc.styles["Heading 2"]
        self.assertEqual(heading2.font.name, "Georgia")
        self.assertEqual(heading2.font.color.rgb, RGBColor(0x8B, 0x00, 0x00))
        self.assertTrue(any(p.style.name == "Heading 2" for p in self.doc.paragraphs))

    def test_template_body_removed_and_report_inserted(self):
        texts = body_texts(self.doc)
        self.assertNotIn(SAMPLE_BODY_TEXT, texts)
        self.assertIn("Executive Summary", texts)
        self.assertIn("Key Points", texts)
        self.assertGreater(len(self.doc.tables), 3)

    def test_missing_styles_added_and_reported(self):
        added = set(self.result["template_styles_added"])
        self.assertTrue(added <= set(DROPPED_STYLES))
        self.assertIn("List Bullet", added)
        self.assertIn("Light List Accent 1", added)
        self.assertNotIn("List Number", added)  # el informe no tiene listas numeradas
        self.assertIn("List Bullet", self.logs.output[0])
        for name in added:
            self.assertIsNotNone(tool._style_by_name(self.doc, name))

    def test_bullets_get_their_own_numbering(self):
        bullets = [p for p in self.doc.paragraphs if p.style.name == "List Bullet"]
        self.assertTrue(bullets)
        self.assertEqual(list_format(self.doc, "List Bullet"), "bullet")

    def test_tables_use_default_table_style(self):
        styles = {t.style.name for t in self.doc.tables}
        self.assertEqual(styles, {tool.DOCX_TABLE_STYLE})

    def test_document_properties(self):
        data = json.loads(DATA["campaign"].read_text())
        props = self.doc.core_properties
        self.assertEqual(props.title, data["report_title"])
        self.assertEqual(props.subject, "Campaign Report")
        self.assertEqual(props.revision, 1)

    def test_result_is_serializable_and_reports_template(self):
        json.dumps(self.result)
        self.assertEqual(self.result["docx_template"], str(self.template.resolve()))

    def test_template_file_not_modified(self):
        before = hashlib.sha256(self.template.read_bytes()).hexdigest()
        self.generate(self.template)
        self.assertEqual(hashlib.sha256(self.template.read_bytes()).hexdigest(), before)


# --------------------------------------------------------------------------- #
# 2. Modos de inserción, formatos y estilos de tabla
# --------------------------------------------------------------------------- #
class TestTemplateModes(TemplateTestCase):
    """Marcador, conservar contenido, .dotx, sin numbering.xml y estilo de tabla propio."""

    def test_marker_inserts_between_cover_and_legal(self):
        template = build_template(self.dir / "marker.docx", marker=True, cover=True)
        _, document = self.generate(template, "executive")
        texts = body_texts(document)
        self.assertNotIn(tool.CONTENT_MARKER, "\n".join(texts))
        cover, summary, legal = (texts.index("PORTADA ACME"), texts.index("Executive Summary"),
                                 texts.index("AVISO LEGAL ACME"))
        self.assertLess(cover, summary)
        self.assertLess(summary, legal)
        self.assertEqual(texts[-1], "AVISO LEGAL ACME")

    def test_marker_with_spaces(self):
        template = build_template(self.dir / "marker2.docx", sample_text=False)
        document = docx.Document(str(template))
        document.add_paragraph("  {{ report_content }}  ")
        document.save(str(template))
        _, result_doc = self.generate(template, "executive")
        self.assertNotIn("report_content", "\n".join(body_texts(result_doc)))

    def test_keep_template_content_appends(self):
        template = build_template(self.dir / "keep.docx")
        _, document = self.generate(template, "executive", keep_template_content=True)
        texts = body_texts(document)
        self.assertEqual(texts[0], SAMPLE_BODY_TEXT)
        self.assertGreater(texts.index("Executive Summary"), 0)

    def test_inherited_header_from_removed_section_is_kept(self):
        template = build_template(self.dir / "multi.docx")
        document = docx.Document(str(template))
        document.add_paragraph("Contenido de la sección 1")
        document.add_section()  # la sección final hereda ("vinculada a la anterior") encabezado y pie
        document.add_paragraph("Contenido de la sección 2")
        document.save(str(template))
        with zipfile.ZipFile(template) as package:
            final_sect = re.findall(rb"<w:sectPr[ >].*?</w:sectPr>", package.read("word/document.xml"))[-1]
        self.assertNotIn(b"headerReference", final_sect)  # precondición: hereda
        _, result_doc = self.generate(template, "executive")
        self.assertEqual(len(result_doc.sections), 1)
        self.assertFalse(result_doc.sections[0].header.is_linked_to_previous)
        xml = header_footer_xml(result_doc)
        self.assertIn(HEADER_TEXT, xml)
        self.assertIn(FOOTER_TEXT, xml)
        self.assertIn("<w:drawing", xml)
        self.assertNotIn("Contenido de la sección", "\n".join(body_texts(result_doc)))

    def test_dotx_template(self):
        template = build_template(self.dir / "acme.docx", dotx=True)
        self.assertEqual(template.suffix, ".dotx")
        result, document = self.generate(template, "ta")
        self.assertTrue(result["output_path"].endswith(".docx"))
        self.assertIn(HEADER_TEXT, header_footer_xml(document))
        with zipfile.ZipFile(result["output_path"]) as package:
            self.assertNotIn(DOTX_CT, package.read("[Content_Types].xml"))

    def test_template_without_numbering_part(self):
        template = build_template(self.dir / "nonum.docx", no_numbering=True)
        with zipfile.ZipFile(template) as package:
            self.assertNotIn("word/numbering.xml", package.namelist())
        _, document = self.generate(template, "ta")
        self.assertEqual(list_format(document, "List Bullet"), "bullet")

    def test_custom_corporate_table_style(self):
        template = build_template(self.dir / "acme.docx")
        result, document = self.generate(template, "ia", table_style="ACME Table")
        self.assertEqual({t.style.name for t in document.tables}, {"ACME Table"})
        self.assertNotIn("Light List Accent 1", result["template_styles_added"])

    def test_invalid_table_style_lists_available(self):
        template = build_template(self.dir / "acme.docx")
        with self.assertRaises(tool.TemplateError) as ctx:
            self.generate(template, table_style="Inexistente")
        self.assertIn("ACME Table", str(ctx.exception))
        with self.assertRaises(tool.TemplateError):
            self.generate(template, table_style="Normal")  # existe pero no es de tabla

    def test_html_output_ignores_template(self):
        template = build_template(self.dir / "acme.docx")
        with_template, _ = self.generate(template, "executive", document_type="html")
        html_with = Path(with_template["output_path"]).read_text(encoding="utf-8")
        without, _ = self.generate(None, "executive", document_type="html")
        self.assertEqual(html_with, Path(without["output_path"]).read_text(encoding="utf-8"))
        self.assertIsNone(with_template["docx_template"])

    def test_no_template_matches_original_conversion(self):
        from htmldocx import HtmlToDocx
        html, _ = tool.process_template(DATA["ta"], "4")
        parser = HtmlToDocx()
        parser.table_style = tool.DOCX_TABLE_STYLE
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            reference = parser.parse_html_string(html)
        result, document = self.generate(None, "ta")
        self.assertEqual(body_texts(document), body_texts(reference))
        self.assertEqual(result["template_styles_added"], [])
        self.assertIsNone(result["docx_template"])

    @unittest.skipUnless(LIBREOFFICE, "LibreOffice no instalado")
    def test_pdf_with_template(self):
        template = build_template(self.dir / "acme.docx")
        result, _ = self.generate(template, "executive", document_type="pdf")
        pdf = Path(result["output_path"])
        self.assertEqual(pdf.read_bytes()[:5], b"%PDF-")
        if PDFTOTEXT:
            text = subprocess.run([PDFTOTEXT, str(pdf), "-"], capture_output=True, text=True).stdout
            self.assertIn("ACME Corp", text)
            self.assertIn("Confidencial", text)
            self.assertIn("Executive Summary", text)


# --------------------------------------------------------------------------- #
# 3. Plantillas reales CTID del proyecto
# --------------------------------------------------------------------------- #
class TestCTIDTemplates(TemplateTestCase):
    """Las 4 plantillas oficiales CTID funcionan como plantillas de estilo."""

    def test_all_ctid_templates(self):
        for key, template in CTID_TEMPLATES.items():
            with self.subTest(report=key):
                with self.assertLogs("cti_publishing_tool", "WARNING"):
                    result, document = self.generate(template, key)
                texts = "\n".join(body_texts(document))
                self.assertIn("Key Points", texts)
                self.assertNotIn("template use cases", texts.lower())  # guía de la plantilla eliminada
                self.assertIn("<w:drawing", header_footer_xml(document))  # logos CTID
                self.assertEqual(list_format(document, "List Bullet"), "bullet")


# --------------------------------------------------------------------------- #
# 4. Validación y errores
# --------------------------------------------------------------------------- #
class TestTemplateValidation(TemplateTestCase):
    """Plantillas inexistentes, con extensión incorrecta o corruptas."""

    def test_invalid_templates_raise(self):
        corrupt = self.dir / "roto.docx"
        corrupt.write_bytes(b"no es un docx")
        wrong_ext = self.dir / "logo.pdf"
        wrong_ext.write_bytes(b"%PDF-1.4")
        for template, fragment in ((self.dir / "noexiste.docx", "not found"),
                                   (wrong_ext, ".docx or .dotx"),
                                   (corrupt, "Not a valid Word")):
            with self.subTest(template=template.name):
                with self.assertRaises(tool.TemplateError) as ctx:
                    self.generate(template)
                self.assertIn(fragment, str(ctx.exception))
        self.assertFalse(self.out.exists())  # falla antes de renderizar/exportar

    def test_resolve_accepts_quotes_and_env_var(self):
        template = build_template(self.dir / "con espacio.docx")
        self.assertEqual(tool.resolve_docx_template(f'"{template}"'), template.resolve())
        self.assertIsNone(tool.resolve_docx_template(None))
        with mock.patch.dict(os.environ, {tool.DOCX_TEMPLATE_ENV_VAR: str(template)}):
            self.assertEqual(tool.resolve_docx_template(None), template.resolve())

    def test_required_docx_styles(self):
        html = "<h2>a</h2><h3>b</h3><ul><li>x</li></ul><table></table>"
        self.assertEqual(tool.required_docx_styles(html),
                         ["Heading 2", "Heading 3", "List Bullet", tool.DOCX_TABLE_STYLE])
        self.assertEqual(tool.required_docx_styles("<ol><li>x</li></ol>", None), ["List Number"])
        self.assertEqual(tool.required_docx_styles("<p>x</p>"), [])


# --------------------------------------------------------------------------- #
# 5. Inspección de plantillas (adaptación única al formato corporativo)
# --------------------------------------------------------------------------- #
class TestInspectTemplate(TemplateTestCase):
    """``inspect_docx_template`` informa qué se conserva y qué falta."""

    def test_inspect_blank_template(self):
        info = tool.inspect_docx_template(build_template(self.dir / "acme.docx"))
        json.dumps(info)
        self.assertIn(HEADER_TEXT.strip(), " ".join(info["header_text"]))
        self.assertEqual(info["footer_text"], [FOOTER_TEXT])
        self.assertEqual(info["header_footer_images"], 1)
        self.assertEqual(info["normal_font"], {"name": "Arial", "size_pt": 11.0})
        self.assertEqual(info["page"]["margin_left_cm"], 1.8)
        self.assertEqual(info["mode"], "clear_body")
        self.assertEqual(info["body_elements"], 1)
        self.assertIn("ACME Table", info["table_styles"])
        self.assertEqual(set(info["missing_styles"]), set(DROPPED_STYLES))
        self.assertEqual(len(info["warnings"]), 2)

    def test_inspect_marker_template(self):
        info = tool.inspect_docx_template(build_template(self.dir / "m.docx", marker=True, cover=True))
        self.assertTrue(info["content_marker"])
        self.assertEqual(info["mode"], "marker")
        self.assertFalse(any("will be removed" in w for w in info["warnings"]))

    def test_inspect_does_not_modify_file(self):
        template = build_template(self.dir / "acme.docx")
        before = template.read_bytes()
        tool.inspect_docx_template(template)
        self.assertEqual(template.read_bytes(), before)


# --------------------------------------------------------------------------- #
# 6. Línea de comandos
# --------------------------------------------------------------------------- #
class TestTemplateCLI(TemplateTestCase):
    """Opciones ``--docx_template``, ``--inspect_template`` y variable de entorno."""

    def test_cli_docx_template(self):
        template = build_template(self.dir / "acme corp.docx")
        escaped = str(template).replace(" ", "\\ ")
        result = run_cli("-r", "2", "-f", str(DATA["executive"]), "--docx_template", escaped,
                         "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("does not define", result.stderr)  # aviso de estilos añadidos
        document = docx.Document(str(self.out / f"{DATA['executive'].stem}.docx"))
        self.assertIn(HEADER_TEXT, header_footer_xml(document))

    def test_cli_env_var_default_template(self):
        template = build_template(self.dir / "acme.docx")
        env = {**os.environ, tool.DOCX_TEMPLATE_ENV_VAR: str(template)}
        result = run_cli("-r", "4", "-f", str(DATA["ta"]), "--output_dir", str(self.out), env=env)
        self.assertEqual(result.returncode, 0, result.stderr)
        document = docx.Document(str(self.out / f"{DATA['ta'].stem}.docx"))
        self.assertIn(FOOTER_TEXT, header_footer_xml(document))

    def test_cli_bad_template_exit_1(self):
        result = run_cli("-r", "1", "-f", str(DATA["campaign"]), "--docx_template", "nada.docx",
                         "--output_dir", str(self.out))
        self.assertEqual(result.returncode, 1)
        self.assertIn("DOCX template not found", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_cli_bad_template_fails_before_interactive_prompt(self):
        result = run_cli("--docx_template", "nada.docx")
        self.assertEqual(result.returncode, 1)
        self.assertNotIn("make selections within the CLI", result.stdout)

    def test_cli_inspect_template(self):
        template = build_template(self.dir / "acme.docx")
        result = run_cli("--inspect_template", str(template))
        self.assertEqual(result.returncode, 0, result.stderr)
        info = json.loads(result.stdout)
        self.assertEqual(info["mode"], "clear_body")
        bad = run_cli("--inspect_template", str(self.dir / "x.docx"))
        self.assertEqual(bad.returncode, 1)

    def test_check_dependencies_reports_default_template(self):
        template = build_template(self.dir / "acme.docx")
        with mock.patch.dict(os.environ, {tool.DOCX_TEMPLATE_ENV_VAR: str(template)}):
            deps = tool.check_dependencies()
        self.assertEqual(deps["default_docx_template"], str(template.resolve()))
        self.assertIsNone(deps["default_docx_template_error"])
        with mock.patch.dict(os.environ, {tool.DOCX_TEMPLATE_ENV_VAR: "/no/existe.docx"}):
            deps = tool.check_dependencies()
        self.assertIn("not found", deps["default_docx_template_error"])

    def test_generate_report_silent_on_stdout(self):
        template = build_template(self.dir / "acme.docx")
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(io.StringIO()):
            self.generate(template, "executive")
        self.assertEqual(stdout.getvalue(), "")



class TestCtidTemplatesDir(unittest.TestCase):
    """Localización de las plantillas CTID en el paquete y en el repositorio."""

    def _layout(self, root: Path, templates: Path) -> Path:
        tool_dir = root / "src" / "cti_publishing_tool"
        tool_dir.mkdir(parents=True)
        templates.mkdir(parents=True, exist_ok=True)
        (templates / "CTID-TAReportTemplate.docx").write_bytes(b"x")
        return tool_dir

    def test_distribution_layout(self):
        with tempfile.TemporaryDirectory() as tmp:
            tool_dir = self._layout(Path(tmp), Path(tmp) / "src" / "cti_publishing_tool" / "cti-templates")
            self.assertEqual(tool._find_ctid_templates_dir(tool_dir), tool_dir / "cti-templates")

    def test_repository_layout(self):
        with tempfile.TemporaryDirectory() as tmp:
            tool_dir = self._layout(Path(tmp), Path(tmp) / "templates")
            self.assertEqual(tool._find_ctid_templates_dir(tool_dir), Path(tmp) / "templates")

    def test_not_found_falls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            tool_dir = Path(tmp) / "a" / "b"
            tool_dir.mkdir(parents=True)
            (Path(tmp) / "templates").mkdir()  # existe pero sin plantillas CTID
            self.assertEqual(tool._find_ctid_templates_dir(tool_dir), tool_dir / "cti-templates")

    def test_current_project_has_templates(self):
        self.assertTrue(any(tool.CTID_TEMPLATES_DIR.glob("CTID-*.docx")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
