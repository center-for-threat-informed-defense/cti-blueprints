import { AppCommand } from "../AppCommand";
import { PageEditor } from "../../Page/PageEditor";
import { ApplicationStore } from "@/store/StoreTypes";

export class UnloadFile extends AppCommand {

    /**
     * The page editor to unload.
     */
    private _editor: PageEditor;

    /**
     * The application context.
     */
    private _context: ApplicationStore;


    /**
     * Unloads a page editor from the application.
     * @param context
     *  The application context.
     * @param file
     *  The id of the page editor to unload.
     */
    constructor(context: ApplicationStore, id: string) {
        super();
        this._context = context;
        let editor = context.editors.get(id);
        if(!editor) {
            throw new Error(`Editor '${ id }' not found.`);
        } else if(editor.id === PageEditor.Phantom.id) {
            throw new Error(`The phantom editor cannot be unloaded.`)
        } else {
            this._editor = editor;
        }
    }


    /**
     * Executes the command.
     */
    public execute(): void {
        let editors = this._context.editors;
        // Get next page
        let ids = [...editors.keys()];
        let idx = ids.indexOf(this._editor.id);
        if(idx === editors.size - 1) {
            idx -= 1;
        } else {
            idx += 1;    
        }
        let page = editors.get(ids[idx])!;
        // Switch page
        this._context.activeEditor = page;
        // Delete page
        editors.delete(this._editor.id);
    }

}
