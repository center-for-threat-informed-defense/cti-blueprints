import * as PageCommands from "@/assets/scripts/PageEditor/Commands"
import { Browser } from "@/assets/scripts/Utilities/Browser";
import { PageElement, TabularProperty } from "@/assets/scripts/Page";

export class ImportCSVPlugin {

    /**
     * Creates a new {@link ImportCSVPlugin}.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty, page: PageElement) {
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
                    commands.push(PageCommands.createTabularPropertyRow(property, obj));
                }
                // Execute commands
                page.emit("execute", ...commands);
            });
        });
    }

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
        let head = lines[0].split(/,/g);
        for(let i = 1; i < lines.length; i++) {
            let obj = []
            let cells = lines[i].split(/\,/g);
            for(let j = 0; j < head.length; j++) {
                obj.push([head[j], cells[j]]);
            }
            objs.push(Object.fromEntries(obj));
        }
        return objs;
    }

}
