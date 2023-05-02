from liquid import Template, Environment, FileSystemLoader
import sys
import argparse
import os
import json
from htmldocx import HtmlToDocx
from docx2pdf import convert


def cli():
    # Take command line parameters argv
    # No parameters results in a guide:
        # Hit 1 to export `reportType`
        # Hit 2 to export `otherReportType`
        # etc.
    # Type out absolute path, or allow dragging a file to console
    # Features should include: 

    # TODO: Add print statement to explain CLI instructions?
    # TODO: Make a better menu
    # TODO: Order of CLI inputs should be:
    #   type of report
    #   exclude
    #   filepath to data input file
    choice = ""

    while choice not in ['1', '2', '3', '4']:
        choice = input(
            """\tExport menu options:
            \t1. Campaign Report
            \t2. Executive Report
            \t3. IA Report
            \t4. TA Report
            >  """
        )
        if choice == '1':
            print("Campaign Report template\n")
            report_type = 'Campaign'
        elif choice == '2':
            print("Executive Report template\n")
            report_type = 'Executive'
        elif choice == '3':
            print("IA Report template\n")
            report_type = 'IA'
        elif choice == '4':
            print("TA Report template\n")
            report_type = 'TA'
        else:
            print("Choose a valid option from the list!\n")
    return report_type

def template(data_input_filepath, reportType, excludeParams=None):
    """
    Load the template from memory
    As the `reportType`
    Excluding sections of `excludeParams` from `data`
    
    `data` must be of type loaded json from load_data
    """
    data = load_data(data_input_filepath)
    reportType = reportType.lower()
    print("3: Template")
    _env = Environment(
        loader=FileSystemLoader('templates/')
    )
    if reportType == None or reportType == 'campaign':
        # Default to campaign report.   
        _template = 'CTID-CampaignReportTemplate.html'
    elif reportType == 'executive':
        _template = 'CTID-ExecutiveReportTemplate.html'
    elif reportType == 'ia':
        _template = 'CTID-IAReportTemplate.html'
    elif reportType == 'ta':
        _template = 'CTID-TAReportTemplate.html'
    else:
        # Must be an invalid, or example/test case:
        _template = 'example_template.html'

    temp = _env.get_template(_template)
    rendered_template = temp.render(data)
    filename = os.path.splitext(os.path.split(data_input_filepath)[-1])[0]+'.html'
    
    # Save rendered template as an HTML file
    # Rendered HTML can be converted to DOCX or PDF files.
    with open("output/"+filename, 'w') as file:
        file.write(rendered_template)
    # TODO: Incorporate `excludeParams` usage.


def doc_convert(filepath_to_html, doc_type='docx'):
    print("4: Convert " + doc_type)
    filename = os.path.splitext(filepath_to_html)[0]
    if doc_type == 'docx':
        new_parser = HtmlToDocx()
        new_parser.table_style = 'Light List Accent 1'
        new_parser.parse_html_file(filepath_to_html, filename)
    elif doc_type == 'pdf':
        input_f = r"C:\Users\tiffanylee\Downloads\CTID\cti-blueprints\src\liquid\output\An Example Campaign Report.docx"
        output_f = r"C:\Users\tiffanylee\Downloads\CTID\cti-blueprints\src\liquid\output\An Example Campaign Report.pdf"
        convert(input_f, output_f)


def load_data(data_input_filepath):
    """
    Expects a str of the JSON to convert. Simply loads it into Python and returns it
    """
    with open(data_input_filepath, 'r') as _fileObj:
        data_json = json.load(_fileObj)
        return data_json

if __name__ == "__main__":
    print("1: Start")
    parser = argparse.ArgumentParser()
    parser.add_argument('-r', '--reportType', 
                        help='The report type to generate')
    # TODO: Restrict -r type very firmly?
    parser.add_argument('-e', '--excludeSection', action='extend', nargs='*', 
                        help='Fields to exclude from export')
    parser.add_argument('-f', '--data_input_filepath', help="An absolute path to the JSON data input")
    args = parser.parse_args()  # Load arguments from console into a Namespace object

    if len(sys.argv) == 1:  # No parameters given. Initiate CLI
        args.reportType, args.excludeSection, args.data_file_input = cli()
    # print(args)

    template(args.data_input_filepath, args.reportType, args.excludeSection) 
    filename = os.path.splitext(os.path.split(args.data_input_filepath)[-1])[0]+'.html'
    doc_convert("output/" + filename)
    doc_convert("output/" + filename, 'pdf')


def todo():
    """
    A running list of remaining TODO's
        0! Rename this file! liquid_pipeline.py? liquid pypline? liquid_publish_pipeline?
        1. Solidify cli().
            a. Change to 0 positional arguments, only optional.
                i. Order must be: 
                    report_type > sections_to_exclude > data_filepath
            b. Improve interface prompts to be more intuitive.
        2. Change `doc_convert` to work with local paths.
        3. Implement `excludeSection` to do something.
        4. Create a way to import published Attack Flow techniques (.json files) to ensure data can be pulled
        5. Check for file drag-drop path inputting.
            NOTE: It seems like this is already supported on Windows. Unsure about on other systems. Drag&drop
                    filepaths are supported on CMD and VSCode.
        6. Ending tasks:
            a. Clean up comments
            b. Write docstrings
    """