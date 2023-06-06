import { AppCommand } from "../AppCommand";
import { PageEditor } from "@/assets/scripts/PageEditor";
import { ApplicationStore } from "@/store/StoreTypes";

export class SwitchActivePage extends AppCommand {

    /**
     * The page editor to load.
     */
    private _editor: PageEditor;

    /**
     * The application context.
     */
    private _context: ApplicationStore;


    /**
     * Switches the application's active page editor.
     * @param context
     *  The application context.
     * @param id
     *  The page editor's id.
     */
    constructor(context: ApplicationStore, id: string) {
        super();
        this._context = context;
        let editor = context.editors.get(id);
        if(editor) {
            this._editor = editor;
        } else {
            throw new Error(`Editor '${ id }' not found.`);
        }
    }


    /**
     * Executes the command.
     */
    public execute(): void {
        this._context.activeEditor = this._editor;
    }

}
