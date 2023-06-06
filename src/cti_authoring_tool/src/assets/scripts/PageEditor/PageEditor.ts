import * as PageImporter from "./PageImporter";
import * as PageExporter from "./PageExporter";
import { version } from "@/../package.json";
import { PageCommand } from "./Commands/PageCommand";
import { Page, Property } from "../Page";

export class PageEditor {
    
    /**
     * The phantom page editor.
     */
    public static Phantom: PageEditor = new this(
        "", [], new Page({ id: "phantom_template" })
    );

    /**
     * The editor's id.
     */
    public readonly id: string;

    /**
     * The page's keys.
     */
    public readonly keys: ReadonlyArray<Property>;
    
    /**
     * The page's template name.
     */
    public readonly template: string;

    /**
     * The editor's page.
     */
    public readonly page: Page;

    /**
     * The editor's undo stack.
     */
    private _undoStack: PageCommand[];

    /**
     * The editor's redo stack.
     */
    private _redoStack: PageCommand[];      
 

    /**
     * The page's name.
     */
    public get name(): string {
        let name = this.keys
            .map(o => o.toString())
            .filter(o => o !== undefined)
            .join(" - ");
        return name || `Untitled ${ this.template }`;
    };


    /**
     * Creates a new {@link PageEditor}.
     * @param template
     *  The page's template name.
     * @param keys
     *  The page's keys.
     * @param page
     *  The page.
     */
    private constructor(template: string, keys: string[], page: Page) {
       
        // Initialize state
        this.id = page.instance;
        this.page = page;
        this.template = template;
        this._undoStack = [];
        this._redoStack = [];
        
        // Resolve keys
        let _keys = [];
        for(let key of keys) {
            let [s, p] = key.split(/\./g);
            let property, section;
            if(section = page.sections.get(s)) {
                property = section.properties.get(p)
            }
            if(property) {
                _keys.push(property);
            }
        }
        this.keys = _keys;
        
        // Subscribe to execute event
        this.page.on("execute", (command: PageCommand) => {
            this.execute(command);
        });

    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Command Execution  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Executes a page command.
     * @param command
     *  The command.
     */
    public execute(command: PageCommand) {
        if(command.page !== this.page.instance) {
            throw new Error(
                "Command is not configured to operate on this page."
            );
        }
        if(command.execute()) {
            this._redoStack = [];
            this._undoStack.push(command);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Page History  //////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Undoes the last page command.
     */
    public undo() {
        if(this._undoStack.length) {
            this._undoStack.at(-1)!.undo();
            this._redoStack.push(this._undoStack.pop()!);
        }
    }

    /**
     * Tests if the last command can be undone.
     * @returns
     *  True if the last command can be undone, false otherwise.
     */
    public canUndo(): boolean {
        return 0 < this._undoStack.length;
    }

    /**
     * Redoes the last undone page command.
     */
    public redo() {
        if(this._redoStack.length) {
            this._redoStack.at(-1)!.execute();
            this._undoStack.push(this._redoStack.pop()!);
        }
    }

    /**
     * Tests if the last undone command can be redone.
     * @returns
     *  True if the last undone command can be redone, false otherwise.
     */
    public canRedo(): boolean {
        return 0 < this._redoStack.length;
    }

    
    ///////////////////////////////////////////////////////////////////////////
    //  3. Page Import & Export  //////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Creates a new page.
     * @param template
     *  The page's template.
     * @returns
     *  The page's editor.
     */
    public static createNew(template: PageImporter.PageTemplate): PageEditor {
        return new this(template.name, template.keys, PageImporter.newPage(template).page);
    }

    /**
     * Deserializes a page export.
     * @param template
     *  The page's template.
     * @param value
     *  The page's values.
     * @returns
     *  The page's editor.
     */
    public static fromFile(template: PageImporter.PageTemplate, value: any): PageEditor {
        return new this(template.name, template.keys, PageImporter.newPage(template, undefined, value).page);
    }

    /**
     * Exports the page as a text file.
     * @returns
     *  The serialized page.
     */
    public toFile(): string {
        return JSON.stringify({
            ...PageExporter.serialize(this.page).toObject(),
            __document: {
                authoring_tool_version: version,
                template_name: this.template,
                template_version: "0.1.0",
                template_identifier: this.page.id
            }
        }, null, 4);
    }

}
