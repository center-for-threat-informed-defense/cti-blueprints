from liquid import Template, Environment, FileSystemLoader
import sys
import argparse
import os
import json


def cli():
    # Take command line parameters argv
    # No parameters results in a guide:
        # Hit 1 to export `reportType`
        # Hit 2 to export `otherReportType`
        # etc.
    # Type out absolute path, or allow dragging a file to console
    # Features should include: 
    #   - 

    # TODO: Add print statement to explain CLI instructions?
    # TODO: Make a better menu
    choice = ""

    while choice not in ['1', '2', '3', '4']:
        choice = input(
            """\tExport menu:\n
            \t1. Campaign Report\n
            \t2. Executive Report\n
            \t3. IA Report\n
            \t4. TA Report
            """
        )
        if choice == '1':
            print("Campaign Report template\n")
        elif choice == '2':
            print("Executive Report template\n")
        elif choice == '3':
            print("IA Report template\n")
        elif choice == '4':
            print("TA Report template\n")
        else:
            print("Choose a valid option from the list!\n")

def template(data, reportType=None, excludeParams=None):
    """
    Load the template from memory
    As the `reportType`
        TODO: Set up format of reportType from cli()
    Excluding sections of `excludeParams` from `data`
    
    `data` must be of type loaded json from load_data
    """
    print("3: Template")

    _env = Environment(
        loader=FileSystemLoader("./templates/")
    )
    temp = _env.get_template('example_template.html')
    _t = temp.render(data)
    # print(type(_t))
    # print(_t)

    with open("output/example_rendered.html", 'w') as file:
        file.write(_t)
    # print(temp.render(data))
    # TODO: Incorporate `excludeParams` usage.
    # TODO: Make a way to parse out the name of the file


def doc_convert(filepath_to_html, doc_type='docx'):
    # TODO: Handle `doc_type` 
    from htmldocx import HtmlToDocx
    from xhtml2pdf import pisa 

    print("4: Convert")
    
    if doc_type == 'docx':
        new_parser = HtmlToDocx()
        new_parser.parse_html_file(filepath_to_html, os.path.splitext(filepath_to_html)[0])
    elif doc_type == 'pdf':
        with open(filepath_to_html, "r") as input_file:
            with open(os.path.splitext(filepath_to_html)[0]+'.pdf', "w+b") as result_file:
                pisa_status = pisa.CreatePDF(
                    input_file,
                    dest = result_file
                )
    return pisa_status.err




def load_data(filepath):
    """
    Expects a str of the JSON to convert. Simply loads it into Python and returns it
    """
    with open(filepath, 'r') as _fileObj:
        data = json.load(_fileObj)
        return data

if __name__ == "__main__":
    print("1: Start")
    parser = argparse.ArgumentParser()
    parser.add_argument('filepath', nargs='?')
    # parser.add_argument('-f', '--filepath', nargs='?')
    parser.add_argument('-r', '--reportType', 
                        help='The report type to generate')
    # TODO: Restrict -r type very firmly.
    parser.add_argument('-e', '--excludeSection', action='extend', nargs='*',
                        # dest=excludeParams, 
                        help='Fields to exclude from export')
    args = parser.parse_args()  # Load arguments from console into a Namespace object
    if len(sys.argv)-1 < 2:  # Only a filepath was provided. Step through the CLI
        cli()
    print(args)

    template(load_data(args.filepath), args.reportType, args.excludeSection)
    doc_convert("output/example_rendered.html", 'pdf')


def todo():
    """
    A running list of remaining TODO's
        0! Rename this file to something better... liquid_pipeline.py? liquid pypline?
        1. Create the CLI guide. Currently it is designed to take in files already
            so the remaining task is to handle adding no optional parameters
                a. Possibly create 2 different methods (just to showcase different methods)
                    i. Without any positional arguments
                    ii. With positional argument that takes in the filepath
        2. Create a template for exporting Attack Flow json techniques just to ensure data CAN be pulled
        3. Check for file drag-drop path inputting.
            NOTE: It seems like this is already supported on Windows. Unsure about on other systems. Drag&drop
                    filepaths are supported on CMD and VSCode.
    """