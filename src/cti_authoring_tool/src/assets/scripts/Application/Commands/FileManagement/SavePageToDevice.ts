import Configuration from "@/assets/configuration/app.config";
import { Browser } from "@/assets/scripts/Utilities/Browser";
import { AppCommand } from "../AppCommand";
import { PageEditor } from "@/assets/scripts/PageEditor";
import { ApplicationStore } from "@/store/StoreTypes";

export class SavePageToDevice extends AppCommand {

    /**
     * The page's editor.
     */
    private _editor: PageEditor;


    /**
     * Saves a page to the user's file system.
     * @param context
     *  The application context.
     * @param id
     *  The id of the page.
     */
    constructor(context: ApplicationStore, id: string) {
        super();
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
        Browser.downloadTextFile(
            this._editor.name,
            this._editor.toFile(),
            Configuration.file_type_extension
        );
    }

}
