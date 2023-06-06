# cti-publishing-tool

## Purpose
The purpose of this directory is to convert JSON exports from the CTI Authoring Tool into common formats for distribution or storage. Currently available formats are: Microsoft Word DOCX and PDF. Additionally, a HTML file is generated if users wish to convert reports independently.

## Project setup
Run all commands in the publishing folder.
```
pip install -r requirements.txt
```

## Dependencies
This library will not work without the following libraries:
liquid, htmldocx, docx2pdf

## Functionality, features
* Incremental guided command line interface for users unfamiliar with Python scripts.
* Command line arguments skip the interface for users experienced with Python scripts.
* Users are able to select specified categories for publication, or exclude specified categories from publication.
* Files can be dragged and dropped onto the terminal to quickly input the datafile's location on disk.
* Unrecognized arguments will be skipped, making it so that unneccessary sections will not be appended.

## How to run console script
To step through the guided publishing process:
```
python cti_publishing_tool.py
``` 
To skip the guide, use the arguments listed from:
```
python cti_publishing_tool.py --help
```
Argument explanation:
| argument | description | required | input restriction (if any) |
| - | - | - | -|
|-f --data_input_filepath | An absolute path to the JSON data input |yes||
| -r --report_type | The report type to generate. (1) Campaign (2) Executive (3) Intrusion Analysis (4) Threat Actor | yes | {1, 2, 3, 4} |
| -e --exclude_section | A space separated list of fields to exclude from export. Invalid sections for a report will be ignored. | no | {executive_summary, key_points,  assessment, indicator_analysis, outlook, threat_actor, intelligence_gaps, mitre_attack_table, victims, timeline, iocs, signatures, intelligence_requirements, data_sources,  metadata} |
| -o --only_section | A space separated list of fields to include in the export. Unspecified and invalid sections for a report will be ignored. | no | {executive_summary, key_points, assessment, indicator_analysis, outlook, threat_actor, intelligence_gaps, mitre_attack_table, victims, timeline, iocs, signatures, intelligence_requirements, data_sources, metadata} |
|-d --document_type | Document type to export. Default value is a DOCX | no | {docx, pdf} |

## Section for feedback and error messages
If an error is encountered when using the publishing tool, open an issue in Github with as many detials as possible.
Contact ctid@mitre-engenuity.org directly for more general inquiries.

## Example usage:
Generate a campaign report without stepping through the guide:
```
python cti_publishing_tool.py -r 1 -f "C:\Users\usr\Desktop\An Example Campaign Report.json"
```
Generate an executive report with only the key points:
```
python cti_publishing_tool.py -r 3 -f "C:\Users\usr\Desktop\An Example Executive Report.json" -o key_points
```