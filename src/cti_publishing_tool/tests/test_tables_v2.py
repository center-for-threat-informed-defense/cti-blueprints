"""Tests funcionales de la generación de tablas (HTML, DOCX y PDF).

Verifican que todas las tablas de todos los informes se generan de forma
homogénea, con y sin plantilla corporativa:

* Contenido completo (incluida la columna Sub Technique del informe IA).
* Ancho total = ancho útil de la página real; diseño fijo; columnas por peso.
* Mismas proporciones para la misma tabla en distintos informes.
* Encabezado en negrita, repetido en cada página y sin palabras partidas.
* Sin negrita en la primera columna; letra uniforme por tabla.
* Tablas sin datos con la fila "No data reported." en todos los formatos.
* Las tablas propias de una plantilla corporativa no se modifican.

Ejecutar desde la raíz del proyecto::

    create_report/bin/python -m unittest discover -s tests -v
"""

import copy
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

import cti_publishing_tool_v2 as tool  # noqa: E402
import document_converter as dc  # noqa: E402

import docx  # noqa: E402
from docx.oxml.ns import qn  # noqa: E402
from docx.shared import Cm  # noqa: E402

DATA = {
    "campaign": PROJECT_DIR / "data" / "An Example Campaign Report.json",
    "executive": PROJECT_DIR / "data" / "An Example Executive Report.json",
    "ia": PROJECT_DIR / "data" / "An Example Intrusion Analysis Report.json",
    "ta": PROJECT_DIR / "data" / "An Example Threat Actor Report.json",
}
CTID = {
    "campaign": tool.CTID_TEMPLATES_DIR / "CTID-CampaignReportTemplate.docx",
    "executive": tool.CTID_TEMPLATES_DIR / "CTID-ExecutiveReportTemplate.docx",
    "ia": tool.CTID_TEMPLATES_DIR / "CTID-IAReportTemplate.docx",
    "ta": tool.CTID_TEMPLATES_DIR / "CTID-TAReportTemplate.docx",
}
LIBREOFFICE = dc.find_libreoffice()
PDFTOTEXT = shutil.which("pdftotext")


def load(key: str) -> dict:
    """Carga los datos de ejemplo de un tipo de informe."""
    return json.loads(DATA[key].read_text(encoding="utf-8"))


def grid(table) -> list[int]:
    """Anchos de la cuadrícula (``w:gridCol``) de una tabla."""
    return [int(c.get(qn("w:w"))) for c in table._tbl.tblGrid.findall(qn("w:gridCol"))]


def headers(table) -> list[str]:
    """Textos de la fila de encabezado."""
    return [c.text for c in table.rows[0].cells]


def run_sizes(table) -> set[float]:
    """Tamaños de letra usados en la tabla."""
    return {r.font.size.pt for c in table._cells for p in c.paragraphs for r in p.runs if r.text.strip()}


def build_a4_template(path: Path) -> Path:
    """Plantilla A4 con márgenes de 2 cm y una tabla propia de portada."""
    document = docx.Document()
    section = document.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.left_margin = section.right_margin = Cm(2)
    document.add_paragraph("PORTADA")
    cover = document.add_table(rows=2, cols=2)
    cover.style = "Table Grid"
    cover.cell(0, 0).text, cover.cell(0, 1).text = "Clasificación", "TLP:AMBER"
    document.add_paragraph(tool.CONTENT_MARKER)
    document.save(str(path))
    return path


class TablesTestCase(unittest.TestCase):
    """Directorio de salida temporal y entorno sin plantilla por defecto."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory(prefix="cti_tables_")
        self.out = Path(self._tmp.name)
        env_patch = mock.patch.dict(os.environ)
        env_patch.start()
        os.environ.pop(tool.DOCX_TEMPLATE_ENV_VAR, None)
        self.addCleanup(env_patch.stop)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def generate(self, key: str, document_type: str = "docx", **kwargs) -> Path:
        """Genera un informe y devuelve la ruta del archivo."""
        kwargs.setdefault("data_input_filepath", None if "report_data" in kwargs else DATA[key])
        result = tool.generate_report(kwargs.pop("data_input_filepath"), key, document_type,
                                      output_dir=self.out, **kwargs)
        return Path(result["output_path"])


# --------------------------------------------------------------------------- #
# 1. Plantillas HTML de tablas
# --------------------------------------------------------------------------- #
class TestTableTemplates(TablesTestCase):
    """Correcciones en las plantillas Liquid de tablas."""

    def test_ia_observed_table_has_sub_technique_and_procedure(self):
        data = load("ia")
        expected = data["mitre_attack_table"]["observed"][0]["sub_technique"]
        self.assertTrue(expected)
        html = tool.render_report_html(data, "ia")
        observed = html.split("TTPs Observed in the Intrusion")[1]
        self.assertIn("<th>Procedure</th>", observed)
        self.assertNotIn("Prodecure", html)
        self.assertIn(f"<td>{expected}</td>", observed)
        document = docx.Document(str(self.generate("ia")))
        table = next(t for t in document.tables if headers(t)[:3] == ["Tactics", "Techniques", "Sub Technique"])
        self.assertEqual(table.cell(1, 2).text, expected)

    def test_ioc_cells_have_no_trailing_spaces(self):
        template = (PROJECT_DIR / "templates" / "sections" / "iocs.html").read_text()
        self.assertNotIn("}} </td>", template)
        data = load("ta")
        malware_hash = data["iocs"]["malware"][0]["ioc_malware_hash"]
        self.assertIn(f'<td class="hash">{malware_hash}</td>', tool.render_report_html(data, "ta"))

    def test_docx_cells_trimmed(self):
        # Los datos de ejemplo traen espacios sobrantes ("Chicago, Illinois "); el DOCX los recorta.
        self.assertTrue(any(v["location_granular"].endswith(" ") for v in load("ta")["victims"]))
        document = docx.Document(str(self.generate("ta")))
        for table in document.tables:
            for cell in table._cells:
                for paragraph in cell.paragraphs:
                    self.assertEqual(paragraph.text, paragraph.text.strip())

    def test_template_typo_fixed(self):
        fixed = (PROJECT_DIR / "templates" / "sections" / "mitre_attack_table_ia.html").read_text()
        self.assertNotIn("ttp _entry", fixed)
        backup = PROJECT_DIR / "templates" / "sections_original" / "mitre_attack_table_ia.html"
        if backup.is_file():  # respaldo local, no versionado
            self.assertIn("ttp _entry", backup.read_text())


# --------------------------------------------------------------------------- #
# 2. Formato DOCX de todas las tablas
# --------------------------------------------------------------------------- #
class TestDocxTableFormat(TablesTestCase):
    """Cada tabla de cada informe, con distintas páginas y plantillas."""

    def check_document(self, path: Path) -> int:
        """Verifica el formato de todas las tablas de un DOCX; devuelve cuántas revisó."""
        document = docx.Document(str(path))
        available = tool.text_width_twips(document)
        for index, table in enumerate(document.tables):
            with self.subTest(file=path.name, table=index, headers=headers(table)[:2]):
                tbl_pr = table._tbl.tblPr
                tbl_w = tbl_pr.find(qn("w:tblW"))
                self.assertEqual((tbl_w.get(qn("w:type")), int(tbl_w.get(qn("w:w")))), ("dxa", available))
                self.assertEqual(tbl_pr.find(qn("w:tblLayout")).get(qn("w:type")), "fixed")
                self.assertEqual(sum(grid(table)), available)
                for row in table.rows[1:]:
                    if len({id(c._tc) for c in row.cells}) == len(row.cells):
                        self.assertEqual([c.width.twips for c in row.cells], grid(table))

                look = tbl_pr.find(qn("w:tblLook"))
                self.assertEqual(look.get(qn("w:firstColumn")), "0")
                self.assertEqual(look.get(qn("w:firstRow")), "1")
                margins = tbl_pr.find(qn("w:tblCellMar"))
                self.assertEqual(margins.find(qn("w:left")).get(qn("w:w")), str(tool._CELL_MARGIN_TWIPS))

                tr_pr = table.rows[0]._tr.trPr
                self.assertIsNotNone(tr_pr.find(qn("w:tblHeader")))
                self.assertIsNotNone(tr_pr.find(qn("w:cantSplit")))
                for cell in table.rows[0].cells:
                    for paragraph in cell.paragraphs:
                        self.assertTrue(paragraph.paragraph_format.keep_with_next)
                        self.assertTrue(all(r.bold for r in paragraph.runs if r.text.strip()))
                for row in table.rows[1:]:  # la primera columna no se fuerza a negrita
                    self.assertFalse(any(r.bold for p in row.cells[0].paragraphs for r in p.runs))

                sizes = run_sizes(table)
                self.assertEqual(len(sizes), 1, sizes)
                size = sizes.pop()
                self.assertIn(size, tool.TABLE_FONT_SIZES_PT)
                self.assertEqual(size, tool.choose_table_font_size(headers(table), available))
                minimums = tool.minimum_column_widths(headers(table), size)
                if sum(minimums) <= available * tool._MAX_MINIMUM_SHARE:
                    for width, minimum in zip(grid(table), minimums):
                        self.assertGreaterEqual(width, minimum)
        return len(document.tables)

    def test_all_reports_without_template(self):
        expected = {"campaign": 7, "executive": 1, "ia": 7, "ta": 8}
        for key in DATA:
            self.assertEqual(self.check_document(self.generate(key)), expected[key])

    def test_all_reports_with_ctid_templates(self):
        for key in DATA:
            path = self.generate(key, docx_template=CTID[key], output_name=f"{key}-ctid")
            self.check_document(path)
            self.assertEqual(tool.text_width_twips(docx.Document(str(path))), 9360)

    def test_a4_template_width_and_own_table_untouched(self):
        template = build_a4_template(self.out / "a4.docx")
        original = docx.Document(str(template)).tables[0]._tbl.xml
        path = self.generate("ta", docx_template=template, output_name="ta-a4")
        document = docx.Document(str(path))
        section = document.sections[-1]
        expected = section.page_width.twips - section.left_margin.twips - section.right_margin.twips
        self.assertEqual(expected, 9638)  # A4 (11906) - 2 x 2 cm (1134 twips cada uno)
        self.assertEqual(tool.text_width_twips(document), expected)
        cover = document.tables[0]
        self.assertEqual(cover.cell(0, 1).text, "TLP:AMBER")
        self.assertEqual(cover._tbl.xml, original)  # tabla propia de la plantilla intacta
        report_tables = docx.Document(str(path)).tables[1:]
        self.assertEqual(len(report_tables), 8)
        for table in report_tables:
            self.assertEqual(sum(grid(table)), expected)

    def test_same_table_same_proportions_across_reports(self):
        layouts: dict[tuple, set] = {}
        for key in ("campaign", "ia", "ta"):
            for table in docx.Document(str(self.generate(key))).tables:
                layouts.setdefault(tuple(headers(table)), set()).add(tuple(grid(table)))
        shared = [h for h in layouts if len(layouts[h]) > 0]
        self.assertGreaterEqual(len(shared), 6)
        for header, grids in layouts.items():
            self.assertEqual(len(grids), 1, f"Anchos distintos para la tabla {header[:3]}: {grids}")

    def test_wide_columns_get_more_space(self):
        document = docx.Document(str(self.generate("ta")))
        mitre = next(t for t in document.tables if "Procedure" in headers(t))
        widths = dict(zip(headers(mitre), grid(mitre)))
        self.assertEqual(max(widths, key=widths.get), "Procedure")
        self.assertLess(widths["Tactics"], widths["Procedure"] / 2)

    def test_custom_table_style_still_formatted(self):
        path = self.generate("campaign", docx_template=CTID["campaign"], table_style="Table Grid",
                             output_name="grid")
        document = docx.Document(str(path))
        self.assertTrue(all(t.style.name == "Table Grid" for t in document.tables))
        self.check_document(path)


# --------------------------------------------------------------------------- #
# 3. Tablas sin datos
# --------------------------------------------------------------------------- #
class TestEmptyTables(TablesTestCase):
    """Una lista vacía produce una fila "No data reported." en HTML, DOCX y PDF."""

    def empty_data(self) -> dict:
        data = copy.deepcopy(load("ta"))
        data["victims"] = []
        data["iocs"]["cves"] = []
        return data

    def test_html_marks_only_empty_tables(self):
        html = tool.render_report_html(self.empty_data(), "ta")
        self.assertEqual(html.count(tool.EMPTY_TABLE_TEXT), 2)
        self.assertIn('<td colspan="5" class="empty-table"><i>No data reported.</i></td>', html)
        self.assertIn('<td colspan="7" class="empty-table">', html)
        self.assertNotIn(tool.EMPTY_TABLE_TEXT, tool.render_report_html(load("ta"), "ta"))

    def test_mark_empty_tables_unit(self):
        full = "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>"
        self.assertEqual(tool.mark_empty_tables(full), full)
        empty = "<p>t</p><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody>\n  </tbody></table>"
        self.assertIn('colspan="2"', tool.mark_empty_tables(empty))

    def test_docx_row_merged_across_columns(self):
        path = self.generate("ta", report_data=self.empty_data(), output_name="empty")
        document = docx.Document(str(path))
        victims = next(t for t in document.tables if headers(t)[0] == "Name")
        self.assertEqual(len(victims.rows), 2)
        row = victims.rows[1]
        self.assertEqual(len({id(c._tc) for c in row.cells}), 1)  # una sola celda combinada
        self.assertEqual(row.cells[0].text, tool.EMPTY_TABLE_TEXT)
        self.assertEqual(row.cells[0].width.twips, tool.text_width_twips(document))
        self.assertTrue(all(r.italic for p in row.cells[0].paragraphs for r in p.runs))

    @unittest.skipUnless(LIBREOFFICE and PDFTOTEXT, "LibreOffice/pdftotext no instalados")
    def test_pdf_shows_no_data_row(self):
        path = self.generate("ta", "pdf", report_data=self.empty_data(), output_name="empty-pdf")
        text = subprocess.run([PDFTOTEXT, str(path), "-"], capture_output=True, text=True).stdout
        self.assertEqual(text.count(tool.EMPTY_TABLE_TEXT), 2)


# --------------------------------------------------------------------------- #
# 4. Cálculo de anchos
# --------------------------------------------------------------------------- #
class TestColumnWidths(unittest.TestCase):
    """compute_column_widths, minimum_column_widths y choose_table_font_size."""

    MITRE = ["Attribution", "Tactics", "Techniques", "Sub Technique", "Procedure", "D3FEND", "Deployed Control"]
    MALWARE = ["Attribution", "Malicious Tool Name", "Hash Type", "File Hash", "Associated Files Hash",
               "Brief Description", "Malware Analysis Report (Hyperlink, or N/A)", "First Reported",
               "Last Reported"]

    def test_sum_and_minimums(self):
        for headers_ in (self.MITRE, self.MALWARE, ["A"], ["Name", "Sector"]):
            for available in (8640, 9360, 9638, 13680):
                with self.subTest(headers=headers_[:2], available=available):
                    size = tool.choose_table_font_size(headers_, available)
                    widths = tool.compute_column_widths(headers_, available, size)
                    self.assertEqual(sum(widths), available)
                    for width, minimum in zip(widths, tool.minimum_column_widths(headers_, size)):
                        self.assertGreaterEqual(width, minimum)

    def test_font_size_adapts_to_width(self):
        self.assertEqual(tool.choose_table_font_size(self.MITRE, 8640), 9.0)
        self.assertLess(tool.choose_table_font_size(self.MALWARE, 8640), 9.0)
        self.assertEqual(tool.choose_table_font_size(self.MALWARE, 13680), 9.0)  # apaisado

    def test_extreme_table_still_sums(self):
        many = [f"Column header number {i}" for i in range(20)]
        widths = tool.compute_column_widths(many, 8640)
        self.assertEqual(sum(widths), 8640)
        self.assertTrue(all(w > 0 for w in widths))

    def test_unknown_headers_share_equally_and_empty(self):
        self.assertEqual(tool.compute_column_widths(["Foo", "Bar"], 8000), [4000, 4000])
        self.assertEqual(tool.compute_column_widths([], 8000), [])

    def test_text_units(self):
        self.assertLess(tool._text_units("Attribution"), len("Attribution"))
        self.assertGreater(tool._text_units("MWMW"), 4)


# --------------------------------------------------------------------------- #
# 5. PDF (LibreOffice): encabezados repetidos y sin palabras partidas
# --------------------------------------------------------------------------- #
@unittest.skipUnless(LIBREOFFICE and PDFTOTEXT, "LibreOffice/pdftotext no instalados")
class TestPdfTables(TablesTestCase):
    """Comprobaciones sobre el PDF real generado por LibreOffice."""

    def pdf_pages(self, path: Path) -> list[str]:
        text = subprocess.run([PDFTOTEXT, str(path), "-"], capture_output=True, text=True).stdout
        return text.split("\f")

    def test_header_words_not_broken(self):
        header_words = set()
        for template in ("mitre_attack_table.html", "mitre_attack_table_ia.html", "iocs.html",
                         "victims.html", "timeline.html", "report_intro.html"):
            html = (PROJECT_DIR / "templates" / "sections" / template).read_text()
            for header in re.findall(r"<th>(.*?)</th>", html):
                header_words.update(w for w in re.split(r"[\s/]+", header) if len(w) >= 4)
        for key in ("campaign", "ia", "ta"):
            for template in (None, CTID[key]):
                path = self.generate(key, "pdf", docx_template=template,
                                     output_name=f"{key}-{'ctid' if template else 'plain'}")
                text = "".join(self.pdf_pages(path))
                for word in sorted(header_words):
                    for cut in range(2, len(word) - 1):
                        with self.subTest(file=path.name, word=word):
                            self.assertNotIn(f"{word[:cut]}\n{word[cut:]}\n", text)

    def test_header_repeated_on_every_page_of_long_table(self):
        data = copy.deepcopy(load("ta"))
        row = data["timeline"][0]
        data["timeline"] = [dict(row, attribution=f"ROW-{i:03d}") for i in range(80)]
        path = self.generate("ta", "pdf", report_data=data, output_name="long")
        pages = self.pdf_pages(path)
        table_pages = [p for p in pages if "ROW-" in p]
        self.assertGreaterEqual(len(table_pages), 3)
        for page in table_pages:
            self.assertIn("Start Date", page)  # encabezado repetido en cada página

    def test_page_count_reduced(self):
        path = self.generate("ta", "pdf")
        pages = [p for p in self.pdf_pages(path) if p.strip()]
        self.assertLessEqual(len(pages), 7)  # antes de la corrección: 10 páginas


if __name__ == "__main__":
    unittest.main(verbosity=2)
