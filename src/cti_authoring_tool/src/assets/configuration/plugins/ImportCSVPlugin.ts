import * as PageCommands from "@/assets/scripts/PageEditor/Commands"
import { Browser } from "@/assets/scripts/Utilities/Browser";
import { 
    AtomicProperty, DateTimeProperty, EnumProperty,
    NumberProperty, PageElement, StringProperty,
    TabularProperty
} from "@/assets/scripts/Page";

export class ImportCSVPlugin {

    /**
     * The tabular property.
     */
    private property: TabularProperty;


    /**
     * Creates a new {@link ImportCSVPlugin}.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty, page: PageElement) {
        this.property = property;
        // Register "Import from CSV" action
        property.registerAction("import-csv", "Import from CSV", () => { 
            Browser.openTextFileDialog().then(file => {
                let { contents } = file;
                // Validate contents
                if(contents === null || contents === undefined) {
                    console.error(`Error: could not contents of file: '${ file.filename }'.`);
                }
                // Parse contents
                let objs = this.parseCsv(contents as string);
                // Format commands
                let commands = []
                for(let obj of objs) {
                    obj = this.tryParseRow(obj);
                    commands.push(PageCommands.createTabularPropertyRow(property, obj));
                }
                // Execute commands
                page.emit("execute", ...commands);
            });
        });
    }
    
    
    ///////////////////////////////////////////////////////////////////////////
    //  1. CSV Parsing  ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Parses a simple CSV file.
     * @param contents
     *  The CSV file's contents.
     * @returns
     *  The parsed CSV file.
     */
    private parseCsv(contents: string): any[] {
        let objs = [];
        let lines = contents.split(/\r?\n/g);
        let head = this.segmentCsvLine(lines[0]);
        for(let i = 1; i < lines.length; i++) {
            // Ignore empty lines
            if(/^\s*$/.test(lines[i])) {
                continue;
            }
            // Parse line
            let obj = []
            let cells = this.segmentCsvLine(lines[i]);
            for(let j = 0; j < head.length; j++) {
                obj.push([head[j], cells[j] ?? ""]);
            }
            objs.push(Object.fromEntries(obj));
        }
        return objs;
    }

    /**
     * Segments a single line from a CSV.
     * @param str
     *  The line.
     * @returns
     *  The segmented line. 
     */
    private segmentCsvLine(str: string): string[] {
        str = str.trim();
        let columns = [];
        let beg = 0, end = -1, offset = 0;
        while(beg < str.length) {
            end = -1, offset = 0;
            if(str[beg] === "\"") {
                end = this.indexOf(str, /"\s*,|"$/, beg);
            }
            if(end === -1) {
                end = this.indexOf(str, /,/g, beg);
            } else {
                beg += 1;
                offset += 1;
            }
            if(end === -1) {
                end = str.length;
            } else {
                offset += 1
            }
            columns.push(str.slice(beg, end));
            beg = end + offset;
        }
        if(str[str.length - 1] === ",") {
            columns.push("");
        }
        return columns;
    }

    /**
     * Returns the position of the first match of a regular expression.
     * @param str
     *  The string to search.
     * @param regex
     *  The regular expression. 
     * @param idx 
     *  The index at which to begin searching the String object. If omitted,
     *  search starts at the beginning of the string.
     * @returns
     *  The index of the first match. `-1` if there was no match.
     */
    private indexOf(str: string, regex: RegExp, idx: number = 0) {
        let search = str.slice(idx).search(regex);
        return (search < 0 ? 0 : idx) + search;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. CSV Data Parsing  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Attempts to parse a row from an object.
     * @param obj
     *  The object.
     * @returns
     *  The parsed row.
     */
    private tryParseRow(obj: any): any {
        let row: { [key: string]: any } = {};
        for(let key in obj) {
            // Attempt to match key to property
            let normalKey = this.normalize(key);
            let property = this.property.defaultRow.find(o => {
                let normalName = this.normalize(o.name);
                return o.id === key.trim() || normalName === normalKey;
            });
            // If key matched property:
            if(property) {
                // Attempt to parse value
                row[property.id] = this.tryParseValue(obj[key], property);
            }
        }
        return row;
    }

    /**
     * Attempts to parse property's value from a string. 
     * @param value
     *  The string value.
     * @param property
     *  The property.
     * @returns
     *  The parsed value.
     */
    private tryParseValue(value: string | undefined, property: AtomicProperty): any {
        // If no value, return null value
        if(value === undefined) {
            return null;
        }
        value = value.trim();
        if(value === "") {
            return null;
        }
        // If property is a string
        if(property instanceof StringProperty) {
            return value;
        }
        // If property is a number:
        if(property instanceof NumberProperty) {
            return parseFloat(value);
        }
        // If property is a date, time, or datetime:
        if(property instanceof DateTimeProperty) {
            return new Date(value);
        }
        // If property is an enum:
        if(property instanceof EnumProperty) {
            // Attempt to resolve the enum's id directly
            if(property.options.has(value)) {
                return value;
            }
            // Attempt to resolve the enum's id by text
            for(let [enumValue, text] of property.options) {
                if(this.normalize(text) === this.normalize(value)) {
                    return enumValue;
                }
            }
            return null;
        }
    }

    /**
     * Normalizes a string.
     * @param str
     *  The string to normalize.
     * @returns
     *  The normalized string.
     * @example
     *  normalize("Hello, Audrey!!!");    // "hello audrey"
     *  normalize("  WHITE   SPACE  ");   // "white space"
     *  normalize("ⓦⓔⓘⓡⓓ ⓣⓔⓧⓣ");   // "weird text" 
     * @remarks
     *  The normalized form of a string has no leading or trailing white
     *  spaces, no uppercase letters, no non-alphanumeric characters, is
     *  delimited by single spaces, and is in unicode normalization form.
     */
    private normalize(str: string): string {
        return str
            .trim()
            .toLocaleLowerCase()
            .normalize("NFKD")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/, " ");
    }

}
