import sys
import argparse
import os
import json
from pathlib import Path
import base64
import tempfile
import warnings

from liquid import Environment, FileSystemLoader
from htmldocx import HtmlToDocx
from docx2pdf import convert

# Suppress BeautifulSoup's text link warnings
warnings.filterwarnings("ignore", message='.*looks like a URL.*')

# Configure Liquid environment
env = Environment(loader=FileSystemLoader("templates/sections"))

# Register new line to br filter
def newline_to_br(val):
    return str(val).replace("\\n", "<br>")
env.add_filter("newline_to_br", newline_to_br)

# Register strip new line filter
def strip_newline(val):
    return str(val).replace("\\n", "")
env.add_filter("strip_newline", strip_newline)

# A global map to be used for dynamic HTML templates.
# { Key (variable name from `exclude_sections`): Value (section filename) }
SECTIONS = {
    'header': 'report_header.html',
    'intro': 'report_intro.html',
    'executive_summary': 'executive_summary.html',
    'key_points': 'key_points.html',
    'assessment': 'assessment.html',
    'indicator_analysis': 'indicator_analysis.html',
    'outlook': 'outlook.html',
    'threat_actor': 'threat_actor.html',
    'intelligence_gaps': 'intelligence_gaps.html',
    'mitre_attack_table': 'mitre_attack_table.html',
    'mitre_attack_table_ia': 'mitre_attack_table_ia.html',
    'victims': 'victims.html',
    'timeline': 'timeline.html',
    'iocs': 'iocs.html',
    'signatures': 'signatures.html',
    
    'TORENAMELATER': 'TORENAMELATER.html',

    'intelligence_requirements': 'intelligence_requirements.html',
    'feedback': 'feedback.html',
    'data_sources': 'data_sources.html',
    'metadata': 'metadata_generic.html',
    'metadata_ia': 'metadata_ia.html',
    'footer': 'report_footer.html'
}


def cli():
    """ Assign command line parameters when not enough have been provided.
    This function has 4 helper functions to break it up.
    """
    def _report_type():
        report_type_choice = 0
        while True:
            try:
                report_type_choice = int(input(
                    """\tChoose what type of report you would like to export:
                    \t1. Campaign Report
                    \t2. Executive Report
                    \t3. Intrusion Analysis Report
                    \t4. Threat Actor Report
                    >  """
                    ))
                if report_type_choice not in range(1,5):
                    raise ValueError
                else:
                    break
            except ValueError:
                print("Choose a valid option from the list!\n")

        if report_type_choice == 1:
            print("Campaign Report template\n")
        elif report_type_choice == 2:
            print("Executive Report template\n")
        elif report_type_choice == 3:
            print("Intrusion Analysis Report template\n")
        elif report_type_choice == 4:
            print("Threat Actor Report template\n")
        return str(report_type_choice)
    
    def _document_type():
        while True:
            try:
                document_type = int(input(
                """\tChoose what format for the report you would like to generate:
                    \t1. Microsoft Word DOCX file
                    \t2. PDF
                    >  """
                ))
                if document_type not in range(1,3):
                    raise ValueError
                else:
                    break
            except ValueError:
                print("Choose a valid option from the list!\n")

        if document_type == 1:
            document_type = "docx"
        elif document_type == 2:
            document_type = "pdf"
        return document_type

    def _include_exclude(report_type):
        """User inputs which sections to keep or remove from the rendered template based on `report_type`"""
        while True:
            try:
                choice = int(input(
                    """\n\tChoose an option below:
                    \t1. Select the sections to exclude from the document
                    \t2. Select the sections you would only want in the document
                    \t3. Leave everything in the document.  
                    >  """
                ))
                if choice not in range(1, 4):
                    raise ValueError
                break
            except ValueError:
                print("Choose a valid option from the list!\n")
        if choice == 1:
            return _cli_exclude_sections(report_type)
        elif choice == 2:
            return _cli_only_sections(report_type)
        elif choice == 3:
            return []

    def _cli_exclude_sections(report_type):
        """User inputs which sections to keep out of the rendered template based on `report_type`"""
        section_choice = 0
        exclude_sections = set()
        # NOTE: If making no selections, prints 'set()' instead of nothing.
        if report_type == '1':
            while section_choice != 'exit':
                print("\nCurrent selection: ", exclude_sections)
                section_choice = input(
                """\t\nChoose what sections (if any) you would want to exclude:
                \t1.  Executive Summary
                \t2.  Key Points
                \t3.  Assessment
                \t4.  Intelligence Gaps
                \t5.  MITRE ATT&CK Table
                \t6.  Timeline
                \t7.  IOCs
                \t8.  Signatures
                \t9.  Intelligence Requirements
                \t10.  Data Sources
                \t11. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    exclude_sections.add("executive_summary")
                elif section_choice == '2':
                    exclude_sections.add("key_points")
                elif section_choice == '3':
                    exclude_sections.add("assessment")
                elif section_choice == '4':
                    exclude_sections.add("intelligence_gaps")
                elif section_choice == '5':
                    exclude_sections.add("mitre_attack_table")
                elif section_choice == '6':
                    exclude_sections.add("timeline")
                elif section_choice == '7':
                    exclude_sections.add("iocs")
                elif section_choice == '8':
                    exclude_sections.add("signatures")
                elif section_choice == '9':
                    exclude_sections.add("intelligence_requirements")
                elif section_choice == '10':
                    exclude_sections.add("data_sources")
                elif section_choice == '11':
                    exclude_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")

        elif report_type == '2':
            while section_choice != 'exit':
                print("\nCurrent selection: ", exclude_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to exclude:
                \t1. Executive Summary
                \t2. Key Points
                \t3. Assessment
                \t4. Outlook
                \t5. Intelligence Gaps
                \t6. Intelligence Requirements
                \t7. Data Sources
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    exclude_sections.add("executive_summary")
                elif section_choice == '2':
                    exclude_sections.add("key_points")
                elif section_choice == '3':
                    exclude_sections.add("assessment")
                elif section_choice == '4':
                    exclude_sections.add("outlook")
                elif section_choice == '5':
                    exclude_sections.add("intelligence_gaps")
                elif section_choice == '6':
                    exclude_sections.add("intelligence_requirements")
                elif section_choice == '7':
                    exclude_sections.add("data_sources")
                else:
                    print("Choose a valid option from the list!\n")
                
        elif report_type == '3':
            while section_choice != 'exit':
                print("\nCurrent selection: ", exclude_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to exclude:
                \t1. Executive Summary
                \t2. Key Points
                \t3. Indicator Analysis
                \t4. MITRE ATT&CK Table
                \t5. IOCs
                \t6. Signatures
                \t7. Intelligence Requirements
                \t8. Data Sources
                \t9. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    exclude_sections.add("executive_summary")
                elif section_choice == '2':
                    exclude_sections.add("key_points")
                elif section_choice == '3':
                    exclude_sections.add("indicator_analysis")
                elif section_choice == '4':
                    exclude_sections.add("mitre_attack_table")
                elif section_choice == '5':
                    exclude_sections.add("iocs")
                elif section_choice == '6':
                    exclude_sections.add("signatures")
                elif section_choice == '7':
                    exclude_sections.add("intelligence_requirements")
                elif section_choice == '8':
                    exclude_sections.add("data_sources")
                elif section_choice == '9':
                    exclude_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")
            
        elif report_type == '4':
            while section_choice != 'exit':
                print("\nCurrent selection: ", exclude_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to exclude:
                \t1.  Executive Summary
                \t2.  Key Points
                \t3.  Assessment
                \t4.  Threat Actor
                \t5.  Timeline
                \t6.  Intelligence Gaps
                \t7.  MITRE ATT&CK Table
                \t8.  Victims
                \t9.  IOCs
                \t10. Signatures
                \t11. Intelligence Requirements
                \t12. Data Sources
                \t13. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    exclude_sections.add("executive_summary")
                elif section_choice == '2':
                    exclude_sections.add("key_points")
                elif section_choice == '3':
                    exclude_sections.add("assessment")
                elif section_choice == '4':
                    exclude_sections.add("threat_actor")
                elif section_choice == '5':
                    exclude_sections.add("timeline")
                elif section_choice == '6':
                    exclude_sections.add("intelligence_gaps")
                elif section_choice == '7':
                    exclude_sections.add("mitre_attack_table")
                elif section_choice == '8':
                    exclude_sections.add("victims")
                elif section_choice == '9':
                    exclude_sections.add("iocs")
                elif section_choice == '10':
                    exclude_sections.add("signatures")
                elif section_choice == '11':
                    exclude_sections.add("intelligence_requirements")
                elif section_choice == '12':
                    exclude_sections.add("data_sources")
                elif section_choice == '13':
                    exclude_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")
            
        return list(exclude_sections)

    def _cli_only_sections(report_type):
        """User inputs which sections for the rendered template based on `report_type` and is processed as `exclude_sections` to """
        section_choice = 0
        include_sections = set()
        # NOTE: If making no selections, prints 'set()' instead of nothing.
        if report_type == '1':
            while section_choice != 'exit':
                print("\nCurrent selection: ", include_sections)
                section_choice = input(
                """\t\nChoose what sections (if any) you would want to include:
                \t1.  Executive Summary
                \t2.  Key Points
                \t3.  Assessment
                \t4.  Intelligence Gaps
                \t5.  MITRE ATT&CK Table
                \t6.  Timeline
                \t7.  IOCs
                \t8.  Signatures
                \t9.  Intelligence Requirements
                \t10.  Data Sources
                \t11. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    include_sections.add("executive_summary")
                elif section_choice == '2':
                    include_sections.add("key_points")
                elif section_choice == '3':
                    include_sections.add("assessment")
                elif section_choice == '4':
                    include_sections.add("intelligence_gaps")
                elif section_choice == '5':
                    include_sections.add("mitre_attack_table")
                elif section_choice == '6':
                    include_sections.add("timeline")
                elif section_choice == '7':
                    include_sections.add("iocs")
                elif section_choice == '8':
                    include_sections.add("signatures")
                elif section_choice == '9':
                    include_sections.add("intelligence_requirements")
                elif section_choice == '10':
                    include_sections.add("data_sources")
                elif section_choice == '11':
                    include_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")

        elif report_type == '2':
            while section_choice != 'exit':
                print("\nCurrent selection: ", include_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to include:
                \t1. Executive Summary
                \t2. Key Points
                \t3. Assessment
                \t4. Outlook
                \t5. Intelligence Gaps
                \t6. Intelligence Requirements
                \t7. Data Sources
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    include_sections.add("executive_summary")
                elif section_choice == '2':
                    include_sections.add("key_points")
                elif section_choice == '3':
                    include_sections.add("assessment")
                elif section_choice == '4':
                    include_sections.add("outlook")
                elif section_choice == '5':
                    include_sections.add("intelligence_gaps")
                elif section_choice == '6':
                    include_sections.add("intelligence_requirements")
                elif section_choice == '7':
                    include_sections.add("data_sources")
                else:
                    print("Choose a valid option from the list!\n")
                
        elif report_type == '3':
            while section_choice != 'exit':
                print("\nCurrent selection: ", include_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to include:
                \t1. Executive Summary
                \t2. Key Points
                \t3. Indicator Analysis
                \t4. MITRE ATT&CK Table
                \t5. IOCs
                \t6. Signatures
                \t7. Intelligence Requirements
                \t8. Data Sources
                \t9. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    include_sections.add("executive_summary")
                elif section_choice == '2':
                    include_sections.add("key_points")
                elif section_choice == '3':
                    include_sections.add("indicator_analysis")
                elif section_choice == '4':
                    include_sections.add("mitre_attack_table")
                elif section_choice == '5':
                    include_sections.add("iocs")
                elif section_choice == '6':
                    include_sections.add("signatures")
                elif section_choice == '7':
                    include_sections.add("intelligence_requirements")
                elif section_choice == '8':
                    include_sections.add("data_sources")
                elif section_choice == '9':
                    include_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")
            
        elif report_type == '4':
            while section_choice != 'exit':
                print("\nCurrent selection: ", include_sections)
                section_choice = input(
                """\tChoose what sections (if any) you would want to include:
                \t1.  Executive Summary
                \t2.  Key Points
                \t3.  Assessment
                \t4.  Threat Actor
                \t5.  Timeline
                \t6.  Intelligence Gaps
                \t7.  MITRE ATT&CK Table
                \t8.  Victims
                \t9.  IOCs
                \t10. Signatures
                \t11. Intelligence Requirements
                \t12. Data Sources
                \t13. Metadata
                \tType 'exit' when finished.
                >  """
                )
                section_choice = section_choice.strip()
                if section_choice == 'exit':
                    break
                elif section_choice == '1':
                    include_sections.add("executive_summary")
                elif section_choice == '2':
                    include_sections.add("key_points")
                elif section_choice == '3':
                    include_sections.add("assessment")
                elif section_choice == '4':
                    include_sections.add("threat_actor")
                elif section_choice == '5':
                    include_sections.add("timeline")
                elif section_choice == '6':
                    include_sections.add("intelligence_gaps")
                elif section_choice == '7':
                    include_sections.add("mitre_attack_table")
                elif section_choice == '8':
                    include_sections.add("victims")
                elif section_choice == '9':
                    include_sections.add("iocs")
                elif section_choice == '10':
                    include_sections.add("signatures")
                elif section_choice == '11':
                    include_sections.add("intelligence_requirements")
                elif section_choice == '12':
                    include_sections.add("data_sources")
                elif section_choice == '13':
                    include_sections.add("metadata")
                else:
                    print("Choose a valid option from the list!\n")
        
        if report_type == '1':
            campaign = {"executive_summary", "key_points", "assessment", "intelligence_gaps", "mitre_attack_table", "timeline", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata"}
            return list(campaign-include_sections)
        elif report_type == '2':
            executive = {"executive_summary", "key_points", "assessment", "outlook", "intelligence_gaps", "intelligence_requirements", "data_sources"}
            return list(executive-include_sections)
        elif report_type == '3':
            ia = {"executive_summary", "key_points", "indicator_analysis", "mitre_attack_table_ia", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata_ia"}
            return list(ia-include_sections)
        elif report_type == '4':
            ta = {"executive_summary", "key_points", "assessment", "threat_actor", "timeline", "intelligence_gaps", "mitre_attack_table", "victims", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata"}
            return list(ta-include_sections)
        return list()

    def _data_input_path():
        while True:
            data_input_path = input(
                """\t\nInput the full path to the JSON data file for the reports.
                >  """
            )
            data_input_path = data_input_path.strip()
            data_input_path = data_input_path.strip("'")
            data_input_path = data_input_path.strip("\"")
            data_input_path = data_input_path.replace("\ ", "")
            data_input_path = Path(data_input_path)
            if data_input_path == Path():
                # Blank paths are not allowed
                print(data_input_path, type(data_input_path))
                print("\nThis is an invalid path.\n")
            elif os.path.splitext(data_input_path)[-1] != ".json":
                print(os.path.splitext(data_input_path)[-1])
                print("\nFile is not a .json. Please try again.")
            elif not data_input_path.exists():
                print(data_input_path, type(data_input_path))
                print("\nFile cannot be found. Please try again\n")
            else:
                # Input is valid. It is a .json file that exists on disk.
                break
        return data_input_path

    report_type = _report_type()
    document_type = _document_type()
    exclude_sections = _include_exclude(report_type)
    data_input_path = _data_input_path()
    return [report_type, document_type, exclude_sections, data_input_path]

    
def process_template(data_input_filepath, report_type, exclude_sections=None):
    """Load the `report_type` template from memory while excluding sections from `exclude_sections`.
    Returns a tuple of the template as a string and the filename.
    """

    def _load_data(data_input_filepath):
        """Expects a str of the JSON to convert. Simply loads it into Python and returns it"""
        with open(data_input_filepath, 'r') as _file_obj:
            data_json = json.load(_file_obj)
        return data_json

    def _modular_template(exclude_sections, report_type, data):
        """Create a template dynamically by adding sections as needed, without the criteria from `exclude_sections`."""
        campaign = ["executive_summary", "key_points", "assessment", "intelligence_gaps", "mitre_attack_table", "timeline", "iocs", "signatures", "intelligence_requirements", "feedback", "data_sources"]
        executive = ["executive_summary", "key_points", "assessment", "outlook", "intelligence_gaps", "intelligence_requirements",  "feedback", "data_sources"]
        ia = ["executive_summary", "key_points", "indicator_analysis", "mitre_attack_table_ia", "iocs", "signatures", "intelligence_requirements", "feedback",  "data_sources"]
        ta = ["executive_summary", "key_points", "assessment", "threat_actor", "timeline", "intelligence_gaps", "mitre_attack_table", "victims", "iocs", "signatures", "intelligence_requirements", "feedback", "data_sources"]
        all_categories = [campaign, executive, ia, ta]

        _sections = ["header", "intro"] + all_categories[["campaign","executive","ia","ta"].index(report_type)] + ["footer"]
        _template_ = ''
        sect = 'templates/sections/'

        for key in exclude_sections:
            try:
                _sections.remove(key)
            except ValueError:
                # Ignore invalid keys and continue
                pass
        for key in _sections:
            if key == "file":
                _embed_file(data)
            else:
                _template_ += env.get_template(SECTIONS[key]).render(data)
        return _template_
    
    def _embed_file(data):
        # In order to implement, add `KEYNAME` to the section lists in _modular_template
        filemap = data["file"]
        bytes = base64.b64decode(filemap["byte_string"]).decode('utf-8')
        filename = filemap["filename"]

        try:
            os.mkdir("./output/")
        except FileExistsError:
            pass

        with open("./output/" + filename + ".json", "w") as file:
            json.dump(json.loads(bytes), file, indent=4)
        
    _report_map = {
        1: 'campaign',
        2: 'executive',
        3: 'ia',
        4: 'ta'
    }
    data = _load_data(data_input_filepath)
    report_type = _report_map[int(report_type)]

    rendered_template = _modular_template(exclude_sections, report_type, data)
    filename = os.path.splitext(os.path.split(data_input_filepath)[-1])[0]
    return (rendered_template, filename)


def export_report(rendered_template, filename, doc_type='docx'):
    try:
        os.mkdir("./output/")
    except FileExistsError:
        pass
    
    with tempfile.TemporaryDirectory() as temporary_files:
        if doc_type == 'docx':
            new_parser = HtmlToDocx()
            new_parser.table_style = 'Light List Accent 1'
            docx = new_parser.parse_html_string(rendered_template)
            temp_path = os.path.join("./output/", (filename + '.docx'))
            docx.save(temp_path)
        elif doc_type == 'pdf':
            temp_path = os.path.join(temporary_files, (filename + '.docx'))
            # Temporary workaround - with our current PDF conversion library, we require a DOCX.
            new_parser = HtmlToDocx()
            new_parser.table_style = 'Light List Accent 1'
            docx = new_parser.parse_html_string(rendered_template)
            docx.save(temp_path)
            # Remove lines between comments when using a different transformer
            input_f = temp_path
            output_f = os.path.join("./output/", (filename + '.pdf'))
            convert(input_f, output_f)
    print("Document created")
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument('-e', '--exclude_section', action='extend', nargs='*', default=[], choices=["executive_summary","key_points","assessment","indicator_analysis","outlook","threat_actor","intelligence_gaps","mitre_attack_table","victims","timeline","iocs","signatures","intelligence_requirements","data_sources","metadata"],
                       help='A space separated list of fields to exclude from export. Invalid sections for a report will be ignored.')
    group.add_argument('-o', '--only_section', action='extend', nargs='*', default=[], choices=["executive_summary","key_points","assessment","indicator_analysis","outlook","threat_actor","intelligence_gaps","mitre_attack_table","victims","timeline","iocs","signatures","intelligence_requirements","data_sources","metadata"],
                       help='A space separated list of fields to include in the export. Invalid sections for a report will be ignored.')
    parser.add_argument('-r', '--report_type', choices=["1","2","3","4"], help='The report type to generate. \n1: Campaign\n2: Executive\n3. Intrusion Analysis\n4: Threat Actor')
    parser.add_argument('-d', '--document_type', nargs='?', default='docx', help="Document type to export. Default value is a DOCX", type=str.lower, choices=['docx', 'pdf'])
    
    parser.add_argument('-f', '--data_input_filepath', help="An absolute path to the JSON data input", type=Path)
    args = parser.parse_args()  # Load arguments from console into a Namespace object

    if len(sys.argv) - 1 < 3 :  # Not enough parameters given. Initiate CLI
        if args.report_type is None or args.data_input_filepath is None:
            print('Not enough arguments provided, please make selections within the CLI.\n')
            args.report_type, args.document_type, args.exclude_section, args.data_input_filepath = cli()
    args.data_input_filepath = Path(args.data_input_filepath)

    if args.only_section:
        # only_section was inputted
        if args.report_type == '1':
            campaign = {"executive_summary", "key_points", "assessment", "intelligence_gaps", "mitre_attack_table", "timeline", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata"}
            args.exclude_section = list(campaign-set(args.only_section))
        elif args.report_type == '2':
            executive = {"executive_summary", "key_points", "assessment", "outlook", "intelligence_gaps", "intelligence_requirements", "data_sources"}
            args.exclude_section = list(executive-set(args.only_section))
        elif args.report_type == '3':
            ia = {"executive_summary", "key_points", "indicator_analysis", "mitre_attack_table_ia", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata_ia"}
            args.exclude_section = list(ia-set(args.only_section))
        elif args.report_type == '4':
            ta = {"executive_summary", "key_points", "assessment", "threat_actor", "timeline", "intelligence_gaps", "mitre_attack_table", "victims", "iocs", "signatures", "intelligence_requirements", "data_sources", "metadata"}
            args.exclude_section = list(ta-set(args.only_section))

    template = process_template(args.data_input_filepath, args.report_type, args.exclude_section) 
    export_report(template[0], template[1], args.document_type)
