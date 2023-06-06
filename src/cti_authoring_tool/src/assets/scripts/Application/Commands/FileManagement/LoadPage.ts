import { AppCommand } from "../AppCommand";
import { PageEditor } from "@/assets/scripts/PageEditor";
import { ApplicationStore } from "@/store/StoreTypes";

export class LoadPage extends AppCommand {

    /**
     * The page editor to load.
     */
    private _editor: PageEditor;

    /**
     * The application context.
     */
    private _context: ApplicationStore;


    /**
     * Loads a page editor into the application.
     * @param context
     *  The application context.
     * @param file
     *  The page editor to load.
     */
    constructor(context: ApplicationStore, file: PageEditor) {
        super();
        this._context = context;
        this._editor = file;
    }


    /**
     * Executes the command.
     */
    public execute(): void {
        this._context.editors.set(this._editor.id, this._editor);
        this._context.activeEditor = this._editor;
    }

}
