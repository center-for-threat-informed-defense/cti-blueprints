import Configuration from "@/assets/app.config";
import { Browser } from "@/assets/scripts/Browser";
import { PageEditor } from "../../Page/PageEditor";
import { AppCommand } from "../AppCommand";
import { ApplicationStore } from "@/store/StoreTypes";

export class SavePageToDevice extends AppCommand {

    /**
     * The page's editor.
     */
    private _editor: PageEditor;

    /**
     * The application context.
     */
    private _context: ApplicationStore;


    /**
     * Saves a page to the user's file system.
     * @param context
     *  The application context.
     * @param id
     *  The id of the page.
     */
    constructor(context: ApplicationStore, id: string) {
        super();
        this._context = context;
        let editor = context.editors.get(id);
        if(!editor) {
            throw new Error(`Page '${ id }' not found.`);
        } else {
            this._editor = editor;
        }
    }


    /**
     * Executes the command.
     */
    public execute(): void {
        // Browser.downloadTextFile(
        //     this._editor.page.props.toString(),
        //     this._editor.toFile(),
        //     Configuration.file_type_extension
        // );
    }

}
