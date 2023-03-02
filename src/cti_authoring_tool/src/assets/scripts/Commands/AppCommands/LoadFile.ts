import { Browser } from "../../Browser";
import { AppCommand } from "../AppCommand";
import { PageEditor } from "../../Page/PageEditor";
import { PageTemplate } from "../../AppConfiguration";
import { ApplicationStore } from "@/store/StoreTypes";

export class LoadFile extends AppCommand {

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
     * Loads an empty page file into the application.
     * @param context
     *  The application context.
     * @param template
     *  The page's template.
     * @returns
     *  The {@link LoadFile} command.
     */
    public static async fromNew(context: ApplicationStore, template: PageTemplate): Promise<LoadFile> {
        let page = PageEditor.createNew(template);
        return new LoadFile(context, page);
    }

    /**
     * Loads a page export into the application.
     * @param context
     *  The application context.
     * @param file
     *  The page export.
     * @returns
     *  The {@link LoadFile} command.
     */
    public static async fromFile(context: ApplicationStore, file: string): Promise<LoadFile> {
        // TODO: Resolve template
        let page = PageEditor.fromFile({ id: "", name: "", sections: [] }, file);
        return new LoadFile(context, page);
    }

    /**
     * Loads a page file from the file system, into the application.
     * @param context
     *  The application context.
     * @returns
     *  The {@link LoadFile} command.
     */
    public static async fromFileSystem(context: ApplicationStore): Promise<LoadFile> {
        // TODO: Resolve template
        let file = (await Browser.openTextFileDialog()).contents as string;
        let page = PageEditor.fromFile({ id: "", name: "", sections: [] }, file);
        return new LoadFile(context, page);
    }

    /**
     * Loads a page file from a remote url, into the application.
     * @param context
     *  The application context.
     * @param url
     *  The remote url.
     * @returns
     *  The {@link LoadFile} command.
     */
    public static async fromUrl(context: ApplicationStore, url: string): Promise<LoadFile> {
        // TODO: Resolve template
        let file = await (await fetch(url, { credentials: "omit" })).text();
        let page = PageEditor.fromFile({ id: "", name: "", sections: [] }, file);
        return new LoadFile(context, page);
    }

    /**
     * Executes the command.
     */
    public execute(): void {
        this._context.editors.set(this._editor.id, this._editor);
        this._context.activeEditor = this._editor;
    }

}
