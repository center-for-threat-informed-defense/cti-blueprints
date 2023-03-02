import { Page } from "./Page";
import { PageCommand } from "@/assets/scripts/Commands/PageCommand";
import { PageTemplate } from "../AppConfiguration";

export class PageEditor {
    
    /**
     * The editor's id.
     */
    public id: string;

    /**
     * The editor's page.
     */
    public page: Page;

    /**
     * The editor's undo stack.
     */
    private _undoStack: PageCommand[];

    /**
     * The editor's redo stack.
     */
    private _redoStack: PageCommand[];      
 
    /**
     * The phantom page editor.
     */
    public static Phantom: PageEditor = new this(
        new Page({ 
            id: "phantom_template", 
            name: "Phantom Template", 
            sections: []
        })
    );


    /**
     * Creates a new {@link PageEditor}.
     * @param page
     *  The page to edit.
     */
    private constructor(page: Page) {
        this.id = page.instance;
        this.page = page;
        this._undoStack = [];
        this._redoStack = [];
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
    public static createNew(template: PageTemplate): PageEditor {
        return new this(new Page(template));
    }

    /**
     * Deserializes a page export.
     * @param file
     *  The page export.
     * @param template
     *  The page's template.
     * @returns
     *  The page's editor.
     */
    public static fromFile(template: PageTemplate, file: string): PageEditor {
        // Resolve template and pass serialized page
        return new this(new Page(template));
    }

}
