from liquid import Template, Environment, FileSystemLoader
import sys
import argparse
import os
from pathlib import Path
import json
from htmldocx import HtmlToDocx
from docx2pdf import convert

# A global to map sections to append
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
    'mitre_attack_table_ttp': 'mitre_attack_table_ttp.html',
    'victims': 'victims.html',
    'timeline': 'timeline.html',
    'iocs': 'iocs.html',
    'signatures': 'signatures.html',
    
    'TORENAMELATER': 'TORENAMELATER.html',
    # TODO: Rename this file. This file deals with attaching Attack Flows and heat maps (to be implemented in the future)
    # TODO: Handle attaching of AF JSONs & other files and how they will be handled within above HTML module

    'intelligence_requirements': 'intelligence_requirements.html',
    'feedback': 'feedback.html',
    'data_sources': 'data_sources.html',
    'metadata': 'metadata_generic.html',
    'metadata_ia': 'metadata_ia.html',
    'footer': 'report_footer.html'
}


def CLI():
    # Take command line parameters argv
    # No parameters results in a guide:
        # Hit 1 to export `report_type`
        # Hit 2 to export `otherReportType`
        # etc.
    # Type out absolute path, or drag a file to console...

    report_type_choice = 0
    # TODO: Handle invalid chars (e.g. '`'`). This is an issue for all CLI methods
    while int(report_type_choice) not in range(1,5):
        report_type_choice = input(
            """\tChoose what type of report you would like to export:
            \t1. Campaign Report
            \t2. Executive Report
            \t3. Intrusion Analysis Report
            \t4. Threat Actor Report
            >  """
        )
        if report_type_choice == '1':
            print("Campaign Report template\n")
            report_type = 'Campaign'
        elif report_type_choice == '2':
            print("Executive Report template\n")
            report_type = 'Executive'
        elif report_type_choice == '3':
            print("Intrusion Analysis Report template\n")
            report_type = 'IA'
        elif report_type_choice == '4':
            print("Threat Actor Report template\n")
            report_type = 'TA'
        else:
            print("Choose a valid option from the list!\n")

    while True:
        document_type = input(
        """\tChoose what format for the report you would like to generate:
            \t1. Microsoft Word DOCX file
            \t2. PDF
            >  """
        )
        if int(document_type) in [1,2]:
            if document_type == '1':
                document_type = "docx"
            else:
                document_type = "pdf"
            break

    exclude_sections = list(CLI_exclude(report_type))
    while True:
        data_input_path = input(
            """\t\nInput the full path to the JSON data file for the reports.
            >  """
        )
        data_input_path = data_input_path.strip("'")
        data_input_path = data_input_path.strip("\"")
        data_input_path = Path(data_input_path)
        if data_input_path == Path():
            # Blank paths are not allowed
            print(data_input_path, type(data_input_path))
            print("\nThis is an invalid path.\n")
        # elif os.path.splitext(data_input_path)[-1] != ".json":  
        # # TODO: implement file checking.
        #     print(os.path.splitext(data_input_path)[-1])
        #     print("\nFile is not a .json. Please try again.")
        elif not data_input_path.exists():
            print(data_input_path, type(data_input_path))
            print("\nFile cannot be found.\n")
        else:
            break
    # print( [report_type, document_type, exclude_sections, data_input_path])
    return [report_type, document_type, exclude_sections, data_input_path]


def CLI_exclude(report_type):
    """
    This is the portion of the CLI to pick which sections to keep out of the rendered documents.
    """
    section_choice = 0
    exclude_sections = set()
    # NOTE: If making no selections, prints 'set()' instead of nothing.i
    if report_type == 'Campaign':
        while section_choice != 'exit':
            section_choice = input(
            """\t\nChoose what sections (if any) you would want to exclude:
            \t1.  Executive Summary
            \t2.  Key Points
            \t3.  Assessment
            \t4.  Intelligence Gaps
            \t5.  MITRE ATT&CK Table
            \t6.  Timeline
            \t7.  IOCs
            \t8.  Intelligence Requirements
            \t9.  Data Sources
            \t10. Metadata
            \tType 'exit' when finished.
            >  """
            )
            if section_choice == 'exit':
                break
            elif section_choice == '1':
                exclude_sections.add("executive_summary")
                print("Current selection: ", exclude_sections)
            elif section_choice == '2':
                exclude_sections.add("key_points")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '3':
                exclude_sections.add("assessment")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '4':
                exclude_sections.add("intelligence_gaps")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '5':
                exclude_sections.add("mitre_attack_table")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '6':
                exclude_sections.add("timeline")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '7':
                exclude_sections.add("iocs")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '8':
                exclude_sections.add("intelligence_requirements")
                print("\nCurrent selection: ", exclude_sections)
            elif section_choice == '10':
                exclude_sections.add("metadata")
                print("\nCurrent selection: ", exclude_sections)
            else:
                print("Choose a valid option from the list!\n")
                print("\nCurrent selection: ", exclude_sections)

    elif report_type == 'Executive':
        while section_choice != 'exit':
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
            if section_choice == '1':
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
            elif section_choice != 'exit' and int(section_choice) not in range(1,8):
                print("Choose a valid option from the list!\n")
            
    elif report_type == 'IA':
        while section_choice != 'exit':
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
            if section_choice == '1':
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
            elif section_choice != 'exit' and int(section_choice) not in range(1,10):
                print("Choose a valid option from the list!\n")
        
    elif report_type == 'TA':
        while section_choice != 'exit':
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
            if section_choice == '1':
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
            elif section_choice != 'exit' and int(section_choice) not in range(1,14):
                print("Choose a valid option from the list!\n")
        
    else:
        print("Choose a valid option from the list!\n")
    return exclude_sections


def modular_template(exclude_sections):
    """
    Create a template dynamically by adding sections as needed, without the criteria from `exclude_sections`.
    """
    # TODO: Incorporate into `template()`
    dummy = ['data_sources', 'metadata']
    sec_dict = dict()
    for key in exclude_sections:
        sec_dict[key] = False

    


def template(data_input_filepath, report_type, excludeParams=None):
    # TODO: Rename function
    """
    Load the template from memory
    As the `report_type`
    Excluding sections of `excludeParams` from `data`
    
    `data` must be of type loaded json from load_data
    """
    data = load_data(data_input_filepath)
    report_type = report_type.lower()
    # print("3: Template")
    _env = Environment(
        loader=FileSystemLoader('templates/')
    )
    if report_type == None or report_type == 'campaign':
        # Default to campaign report.   
        _template = 'CTID-CampaignReportTemplate.html'
    elif report_type == 'executive':
        _template = 'CTID-ExecutiveReportTemplate.html'
    elif report_type == 'ia':
        _template = 'CTID-IAReportTemplate.html'
    elif report_type == 'ta':
        _template = 'CTID-TAReportTemplate.html'
    else:
        # Must be an invalid, or example/test case:
        _template = 'example_template.html'

    temp = _env.get_template(_template)
    # TODO: Iterate over dictionary keys instead
        # Skip ones in exclude
        # Concatenate to a growing template String
        # And render it below
    rendered_template = temp.render(data)
    filename = os.path.splitext(os.path.split(data_input_filepath)[-1])[0]+'.html'
    
    # Save rendered template as an HTML file
    # Rendered HTML can be converted to DOCX or PDF files.
    with open("output/"+filename, 'w') as file:
        file.write(rendered_template)
    # TODO: Incorporate `excludeParams` usage.


def doc_convert(filepath_to_html, doc_type='docx'):
    # TODO: Rename function
    # print("4: Convert " + doc_type)
    filename = os.path.splitext(filepath_to_html)[0]
    if doc_type == 'docx':
        new_parser = HtmlToDocx()
        new_parser.table_style = 'Light List Accent 1'
        new_parser.parse_html_file(filepath_to_html, filename)
    elif doc_type == 'pdf':
        # Temporary workaround - with out current PDF creation, we require a DOCX.
        new_parser = HtmlToDocx()
        new_parser.table_style = 'Light List Accent 1'
        new_parser.parse_html_file(filepath_to_html, filename)
        # Remove all the above when we find a better transformer
        print(filename)
        print(Path(filename).absolute())
        print(Path(filename+'.docx').absolute())
        input_f = r"C:\Users\tiffanylee\Downloads\CTID\cti-blueprints\src\liquid\output\An Example Campaign Report.docx"
        output_f = r"C:\Users\tiffanylee\Downloads\CTID\cti-blueprints\src\liquid\output\An Example Campaign Report.pdf"
        convert(input_f, output_f)
    print("Done")


def load_data(data_input_filepath):
    """
    Expects a str of the JSON to convert. Simply loads it into Python and returns it
    """
    with open(data_input_filepath, 'r') as _fileObj:
        data_json = json.load(_fileObj)
        return data_json

if __name__ == "__main__":
    # print("1: Start")
    parser = argparse.ArgumentParser()
    parser.add_argument('-r', '--report_type', nargs=1,
                        help='The report type to generate. \n1: Campaign\n2: Executive\n3. Intrusion Analysis\n4: Threat Actor',
                        type=int, choices=[1,2,3,4])
    parser.add_argument('-d', '--document_type', nargs='?', default='docx', help="Document type to export. Default value is a DOCX",
                        type=str.lower, choices=['docx', 'pdf'])
    parser.add_argument('-e', '--exclude_section', action='extend', nargs='*', 
                        help='Fields to exclude from export. Invalid sections for a report will be ignored.')
    # TODO: Find a better way to document 'help' for the exclude_section, so to not have invalid arguments (e.g., 'Executive Summary' instead of 'executive_summary')
        # Perhaps best to have it come from the HTML_dict?
    parser.add_argument('-f', '--data_input_filepath', help="An absolute path to the JSON data input", type=Path)
    args = parser.parse_args()  # Load arguments from console into a Namespace object
    # TODO: Check and raise exceptions for given arguments through command line?

    if len(sys.argv)-1 < 3 :  # Not enough parameters given. Initiate CLI
        # TODO: Change this conditional to be a check for data_input_field and report_type check only.
        print('Not enough arguments provided, please make selections within the CLI.\n')
        args.report_type, args.document_type, args.exclude_section, args.data_input_filepath = CLI()
    # print(args)
    args.data_input_filepath = Path(args.data_input_filepath)

    template(args.data_input_filepath, args.report_type, args.exclude_section) 
    filename = os.path.splitext(os.path.split(args.data_input_filepath)[-1])[0]+'.html'
    doc_convert("output/" + filename, args.document_type)


def todo():
    """
    A running list of remaining TODO's
        *. Change `doc_convert` to work with local paths.
        *. Implement `exclude_section` to do something.
        *. TODO: Test other templates
        *. Create a way to import published Attack Flow techniques (.json files) to ensure data can be pulled
        *. Ending tasks:
            -. Clean up comments
            -. Write docstrings
            -. Remove test files
        NOTE: Using a set in CLI_exclude will print elements in different orders.
        !! Change all filepath objects to be a Path.
    """