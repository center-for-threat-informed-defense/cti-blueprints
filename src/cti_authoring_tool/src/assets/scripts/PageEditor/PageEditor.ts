import * as PageExporter from "./PageExporter";
import { version } from "@/../package.json";
import { PageCommand } from "./Commands/PageCommand";
import { GroupCommand } from "./Commands";
import { PageImporter, PageTemplate } from "./PageImporter";
import { AtomicProperty, Page, ReactivitySystem, Property } from "../Page";

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
     * The currently selected property.
     */
    private _selected: AtomicProperty | null;
 
    
    /**
     * The page's name.
     */
    public get name(): string {
        let name = this.keys
            .map(o => o.toString())
            .filter(o => o !== "")
            .join(" - ");
        return name || `Untitled ${ this.template }`;
    };

    /**
     * The currently selected property.
     */
    public get selected(): AtomicProperty | null {
        return this._selected;
    }


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
       
        // Configure state
        this.id = page.instance;
        this.page = page;
        this.template = template;
        this._undoStack = [];
        this._redoStack = [];
        this._selected = null;
        
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
        
        // Create reactive 'this' if working in a reactive context
        let _this = this;
        if(ReactivitySystem.makeReactive) {
            _this = ReactivitySystem.makeReactive(this);
        }

        // Configure select behavior
        this.page.on("select", (property: AtomicProperty) => {
            _this._selected = property;
        });

        // Configure deselect behavior
        this.page.on("deselect", () => {
            _this._selected = null;
        });

        // Configure command execution behavior
        this.page.on("execute", (...commands: PageCommand[]) => {
            _this.execute(...commands);
        });

    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Command Execution  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Executes one or more page commands.
     * @param commands
     *  The commands.
     */
    public execute(...commands: PageCommand[]) {
        // Package command
        let cmd: PageCommand;
        if(commands.length === 0) {
            return;
        } else if(commands.length === 1) {
            cmd = commands[0];
        } else {
            let grp = new GroupCommand();
            for(let command of commands) {
                grp.add(command);
            }
            cmd = grp;
        }
        // Validate command
        if(cmd.page === PageCommand.NullPage) {
            return;
        }
        if(cmd.page !== this.page.instance) {
            throw new Error(
                "Command is not configured to operate on this page."
            );
        }
        // Execute command
        if(cmd.execute()) {
            this._redoStack = [];
            this._undoStack.push(cmd);
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
    public static createNew(template: PageTemplate): PageEditor {
        let page = new PageImporter(template).initialize().getPage();
        return new this(template.name, template.keys, page);
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
    public static fromFile(template: PageTemplate, value: any): PageEditor {
        let page = new PageImporter(template, value).initialize().getPage();
        return new this(template.name, template.keys, page);
    }

    /**
     * Exports the page as a text file.
     * @returns
     *  The serialized page.
     */
    public toFile(): string {
        return JSON.stringify({
            ...PageExporter.serialize(this.page).toObject(),
            report_date: new Date().toISOString(),
            __document: {
                authoring_tool_version: version,
                template_name: this.template,
                template_version: "0.1.0",
                template_identifier: this.page.id
            }
        }, null, 4);
    }


    ///////////////////////////////////////////////////////////////////////////
    //  4. Phantom Editor  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Tests if the current editor is the phantom editor.
     * @returns
     *  True if the current editor is the phantom editor, false otherwise.
     */
    public isPhantom() {
        return this.id === PageEditor.Phantom.id;
    }

}
