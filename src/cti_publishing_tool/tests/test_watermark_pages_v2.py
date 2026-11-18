"""Tests funcionales de la marca de agua y la numeración de páginas.

Verifican, con y sin plantilla corporativa, desde la API, la CLI y el MCP Server:

* Validación del texto (palabra o frase libre) y el color de la marca de agua.
* Numeración automática: sin opciones en la API, la CLI ni el MCP.
* Detección de campos ``PAGE`` existentes (no se duplica la numeración de la
  plantilla) y creación del pie numerado cuando falta.
* Marca de agua en todos los encabezados (también portada) sin perder logos.
* Marca de agua en HTML (texto escapado) y numeración "no aplica".
* PDF: el número de página aparece en el texto extraído.

Ejecutar desde la raíz del proyecto::

    create_report/bin/python -m unittest discover -s tests -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import cti_publishing_tool_v2 as tool  # noqa: E402
import document_converter as dc  # noqa: E402
from test_mcp_server import CAMPAIGN, MCPTestCase  # noqa: E402

import docx  # noqa: E402
from docx.oxml import parse_xml  # noqa: E402
from docx.oxml.ns import nsdecls, qn  # noqa: E402

DATA = PROJECT_DIR / "data" / "An Example Threat Actor Report.json"
CTID_TA = tool.CTID_TEMPLATES_DIR / "CTID-TAReportTemplate.docx"
VML = "{urn:schemas-microsoft-com:vml}"
LIBREOFFICE = dc.find_libreoffice()
PDFTOTEXT = shutil.which("pdftotext")


def watermark_shapes(document) -> list:
    """Formas de marca de agua de todos los encabezados del paquete."""
    shapes = []
    for part in document.part.package.iter_parts():
        if part.partname.startswith("/word/header"):
            element = parse_xml(part.blob) if not hasattr(part, "element") else part.element
            shapes += [s for s in element.iter(f"{VML}shape")
                       if s.get("id", "").startswith("PowerPlusWaterMarkObject")]
    return shapes


def footer_fields(footer) -> list[str]:
    """Instrucciones de campo de un pie, en orden."""
    return [t.text.strip() for t in footer.part.element.iter(qn("w:instrText"))]


def fresh_document():
    document = docx.Document()
    document.add_paragraph("Contenido")
    return document


class EnvTestCase(unittest.TestCase):
    """Sin plantilla por defecto del entorno y con directorio de salida temporal."""

    def setUp(self) -> None:
        patcher = mock.patch.dict(os.environ)
        patcher.start()
        os.environ.pop(tool.DOCX_TEMPLATE_ENV_VAR, None)
        self.addCleanup(patcher.stop)
        tmp = tempfile.TemporaryDirectory(prefix="cti_wm_test_")
        self.addCleanup(tmp.cleanup)
        self.out = Path(tmp.name)

    def generate(self, **kwargs) -> dict:
        kwargs.setdefault("document_type", "docx")
        return tool.generate_report(DATA, "ta", output_dir=self.out, **kwargs)


# --------------------------------------------------------------------------- #
# 1. Validaciones
# --------------------------------------------------------------------------- #
class TestValidation(unittest.TestCase):

    def test_watermark_normalized_and_default_color(self):
        self.assertEqual(tool.validate_watermark("  CONFIDENCIAL  "), ("CONFIDENCIAL", "C0C0C0"))
        self.assertEqual(tool.validate_watermark("A   B", "#ff0000"), ("A B", "FF0000"))

    def test_empty_watermark_is_none(self):
        self.assertEqual(tool.validate_watermark(None)[0], None)
        self.assertEqual(tool.validate_watermark("   ")[0], None)

    def test_invalid_watermarks(self):
        for text, color in (("X", "red"), ("X", "FFF"), ("a\nb", None),
                            ("x" * (tool.WATERMARK_MAX_CHARS + 1), None)):
            with self.subTest(text=text, color=color), self.assertRaises(ValueError):
                tool.validate_watermark(text, color)

    def test_page_number_format(self):
        self.assertEqual(tool.validate_page_number_format(None), tool.PAGE_NUMBER_FORMAT)
        self.assertEqual(tool.validate_page_number_format("Página {page}"), "Página {page}")
        for bad in ("Página", "{pages}", "x" * 101 + "{page}", "{page}\n"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                tool.validate_page_number_format(bad)


# --------------------------------------------------------------------------- #
# 2. Numeración de páginas
# --------------------------------------------------------------------------- #
class TestPageNumbers(unittest.TestCase):

    def field(self, instr: str, simple: bool = False):
        if simple:
            return parse_xml(f'<w:ftr {nsdecls("w")}><w:p><w:fldSimple w:instr="{instr}"/></w:p></w:ftr>')
        runs = "".join(f"<w:r><w:instrText>{piece}</w:instrText></w:r>" for piece in instr.split("|"))
        return parse_xml(f'<w:ftr {nsdecls("w")}><w:p>{runs}</w:p></w:ftr>')

    def test_detects_page_fields(self):
        self.assertTrue(tool.has_page_number_field(self.field(" PAGE ")))
        self.assertTrue(tool.has_page_number_field(self.field(" PAGE \\* Arabic", simple=True)))
        self.assertTrue(tool.has_page_number_field(self.field(" PA|GE ")))  # partido en dos ejecuciones
        self.assertFalse(tool.has_page_number_field(self.field(" NUMPAGES ")))
        self.assertFalse(tool.has_page_number_field(self.field(" PAGEREF _Toc1 ")))

    def test_adds_footer_to_blank_document(self):
        document = fresh_document()
        self.assertEqual(tool.add_page_numbers(document), 1)
        footer = document.sections[0].footer
        self.assertEqual(footer_fields(footer), ["PAGE", "NUMPAGES"])
        paragraph = footer.paragraphs[-1]
        self.assertEqual(paragraph.text, "Page 1 of 1")  # valores provisionales; Word/LibreOffice los recalculan
        self.assertEqual(paragraph.alignment, 1)  # centrado

    def test_idempotent(self):
        document = fresh_document()
        tool.add_page_numbers(document)
        self.assertEqual(tool.add_page_numbers(document), 0)
        self.assertEqual(footer_fields(document.sections[0].footer), ["PAGE", "NUMPAGES"])

    def test_custom_format_without_total(self):
        document = fresh_document()
        tool.add_page_numbers(document, "Página {page}")
        footer = document.sections[0].footer
        self.assertEqual(footer_fields(footer), ["PAGE"])
        self.assertEqual(footer.paragraphs[-1].text, "Página 1")

    def test_template_numbering_respected(self):
        document = tool.load_docx_template(CTID_TA)
        before = footer_fields(document.sections[0].footer)
        self.assertTrue(tool.document_has_page_numbers(document))
        self.assertEqual(tool.add_page_numbers(document), 0)
        self.assertEqual(footer_fields(document.sections[0].footer), before)


# --------------------------------------------------------------------------- #
# 3. Marca de agua en DOCX
# --------------------------------------------------------------------------- #
class TestWatermarkDocx(unittest.TestCase):

    def roundtrip(self, document):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "wm.docx"
            document.save(str(path))
            return docx.Document(str(path))

    def test_blank_document(self):
        document = fresh_document()
        self.assertEqual(tool.add_watermark(document, "CONFIDENCIAL", "ffc000"), 1)
        shapes = watermark_shapes(self.roundtrip(document))
        self.assertEqual(len(shapes), 1)
        shape = shapes[0]
        self.assertEqual(shape.get("fillcolor"), "#FFC000")
        self.assertEqual(shape.find(f"{VML}textpath").get("string"), "CONFIDENCIAL")
        self.assertIn("rotation:315", shape.get("style"))
        self.assertIn("z-index:-", shape.get("style"))  # detrás del texto

    def test_special_characters_are_escaped(self):
        document = fresh_document()
        tool.add_watermark(document, 'A&B <"x">')
        shape = watermark_shapes(self.roundtrip(document))[0]
        self.assertEqual(shape.find(f"{VML}textpath").get("string"), 'A&B <"x">')

    def test_template_headers_keep_logos(self):
        document = tool.load_docx_template(CTID_TA)
        section = document.sections[0]
        self.assertTrue(section.different_first_page_header_footer)
        drawings = {kind: len(list(getattr(section, kind).part.element.iter(qn("w:drawing"))))
                    for kind in ("header", "first_page_header")}
        self.assertEqual(tool.add_watermark(document, "CONFIDENTIAL"), 2)  # páginas normales y portada
        reopened = self.roundtrip(document)
        self.assertEqual(len(watermark_shapes(reopened)), 2)
        ids = {s.get("id") for s in watermark_shapes(reopened)}
        self.assertEqual(len(ids), 2)  # identificadores únicos
        for kind, count in drawings.items():
            self.assertEqual(len(list(getattr(reopened.sections[0], kind).part.element.iter(qn("w:drawing")))),
                             count, kind)

    def test_long_text_keeps_shape_inside_page(self):
        width, height = tool._watermark_size_pt("W" * tool.WATERMARK_MAX_CHARS)
        self.assertLessEqual(width, 500)
        self.assertGreater(height, 5)
        self.assertLessEqual(tool._watermark_size_pt("X")[1], 130)


# --------------------------------------------------------------------------- #
# 4. generate_report y CLI
# --------------------------------------------------------------------------- #
class TestGenerateReport(EnvTestCase):

    def test_blank_docx_numbered_by_default(self):
        result = self.generate()
        self.assertEqual(result["page_numbers"], "added")
        self.assertIsNone(result["watermark"])
        document = docx.Document(result["output_path"])
        self.assertEqual(footer_fields(document.sections[0].footer), ["PAGE", "NUMPAGES"])
        self.assertEqual(watermark_shapes(document), [])

    def test_template_numbering(self):
        result = self.generate(docx_template=CTID_TA, watermark="CONFIDENCIAL")
        self.assertEqual(result["page_numbers"], "template")
        self.assertEqual(result["watermark"], "CONFIDENCIAL")
        self.assertEqual(len(watermark_shapes(docx.Document(result["output_path"]))), 2)

    def test_numbering_needs_no_options(self):
        # La numeración es automática: no hay parámetros para configurarla o desactivarla.
        for name in ("page_numbers", "page_number_format"):
            with self.subTest(name=name), self.assertRaises(TypeError):
                self.generate(**{name: None})

    def test_html_watermark(self):
        result = self.generate(document_type="html", watermark="<b>BORRADOR</b>")
        self.assertEqual(result["page_numbers"], "not_applicable")
        html = Path(result["output_path"]).read_text(encoding="utf-8")
        self.assertIn("&lt;b&gt;BORRADOR&lt;/b&gt;", html)
        self.assertNotIn("<b>BORRADOR</b>", html)
        self.assertLess(html.index("cti-watermark"), html.lower().rindex("</body>"))

    def test_free_text_watermark(self):
        for text in ("CONFIDENCIAL", "USO INTERNO", "Propiedad de ACME – No distribuir"):
            with self.subTest(text=text):
                result = self.generate(watermark=text, output_name="libre")
                shape = watermark_shapes(docx.Document(result["output_path"]))[0]
                self.assertEqual(shape.find(f"{VML}textpath").get("string"), text)
                self.assertEqual(shape.get("fillcolor"), f"#{tool.WATERMARK_COLOR}")

    def test_invalid_watermark_fails_before_writing(self):
        for kwargs in ({"watermark": "X", "watermark_color": "azul"},
                       {"watermark": "x" * (tool.WATERMARK_MAX_CHARS + 1)}):
            with self.subTest(**kwargs), self.assertRaises(ValueError):
                self.generate(**kwargs)
        self.assertEqual(list(self.out.iterdir()), [])

    def test_export_report_api(self):
        html = tool.render_report_html(tool.load_report_data(DATA), "ta")
        path = tool.export_report(html, "api", "docx", self.out, watermark="BORRADOR")
        document = docx.Document(str(path))
        self.assertEqual(document.sections[0].footer.paragraphs[-1].text, "Page 1 of 1")
        self.assertEqual(len(watermark_shapes(document)), 1)

    def test_cli(self):
        with mock.patch("sys.stdout"):
            code = tool.main(["-r", "4", "-f", str(DATA), "--output_dir", str(self.out), "--no_interactive",
                              "--watermark", "CONFIDENCIAL", "--watermark_color", "#ff0000"])
        self.assertEqual(code, 0)
        document = docx.Document(str(self.out / f"{DATA.stem}.docx"))
        self.assertEqual(footer_fields(document.sections[0].footer), ["PAGE", "NUMPAGES"])
        self.assertEqual(watermark_shapes(document)[0].get("fillcolor"), "#FF0000")

    def test_cli_numbers_without_flags(self):
        with mock.patch("sys.stdout"):
            code = tool.main(["-r", "4", "-f", str(DATA), "--output_dir", str(self.out), "--no_interactive"])
        self.assertEqual(code, 0)
        self.assertTrue(tool.document_has_page_numbers(docx.Document(str(self.out / f"{DATA.stem}.docx"))))
        help_text = tool.build_arg_parser().format_help()
        self.assertNotIn("page_number", help_text)

    def test_cli_invalid_values(self):
        with mock.patch("sys.stderr"):
            self.assertEqual(tool.main(["-r", "4", "-f", str(DATA), "--no_interactive",
                                        "--output_dir", str(self.out), "--watermark_color", "red",
                                        "--watermark", "X"]), 1)
        self.assertEqual(list(self.out.iterdir()), [])

    @unittest.skipUnless(LIBREOFFICE and PDFTOTEXT, "LibreOffice o pdftotext no instalados")
    def test_pdf_page_numbers(self):
        for template, first in ((None, "Page 1 of"), (CTID_TA, "Page 2 of")):
            with self.subTest(template=template):
                result = self.generate(document_type="pdf", docx_template=template, watermark="CONFIDENCIAL",
                                       output_name=f"pdf-{bool(template)}")
                text = subprocess.run([PDFTOTEXT, result["output_path"], "-"], capture_output=True,
                                      text=True, check=True).stdout
                self.assertIn(first, text)
                # La portada CTID no se numera; el resto sí, con el total real.
                self.assertRegex(text, r"Page \d+ of [2-9]")


# --------------------------------------------------------------------------- #
# 5. MCP Server
# --------------------------------------------------------------------------- #
class TestMCPWatermark(MCPTestCase):

    async def test_schema(self):
        properties = (await self.tools())["generate_report"].input_schema["properties"]
        for name in ("watermark", "watermark_color"):
            self.assertIn(name, properties)
            self.assertTrue(properties[name].get("description"), name)
        self.assertNotIn("TLP", properties["watermark"]["description"])
        # La numeración es automática: no se expone como parámetro.
        self.assertFalse({"page_numbers", "page_number_format"} & set(properties))

    async def test_generate_with_watermark(self):
        result = await self.call_ok("generate_report", report_type="campaign", data_file=CAMPAIGN,
                                    watermark="CONFIDENCIAL")
        self.assertEqual(result["watermark"], "CONFIDENCIAL")
        self.assertEqual(result["page_numbers"], "added")
        document = docx.Document(result["output_path"])
        self.assertEqual(document.sections[0].footer.paragraphs[-1].text, "Page 1 of 1")
        self.assertEqual(len(watermark_shapes(document)), 1)

    async def test_template_numbering(self):
        result = await self.call_ok("generate_report", report_type="campaign", data_file=CAMPAIGN,
                                    docx_template="CTID-CampaignReportTemplate.docx")
        self.assertEqual(result["page_numbers"], "template")
        self.assertIsNone(result["watermark"])

    async def test_invalid_values(self):
        message = await self.call_error("generate_report", report_type="campaign", data_file=CAMPAIGN,
                                        watermark="X", watermark_color="red")
        self.assertIn("watermark_color", message)
        self.assertFalse(self.out.exists() and any(self.out.iterdir()))


if __name__ == "__main__":
    unittest.main()
