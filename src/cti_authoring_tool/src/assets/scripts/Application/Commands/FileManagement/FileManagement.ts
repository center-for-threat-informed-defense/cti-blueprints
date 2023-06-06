import Configuration from "@/assets/configuration/app.config";
import { Browser } from "@/assets/scripts/Utilities/Browser";
import { LoadPage } from "./LoadPage";
import { AppCommand } from "../AppCommand";
import { UnloadPage } from "./UnloadPage";
import { ApplicationStore } from "@/store/StoreTypes";
import { SwitchActivePage } from "./SwitchActivePage";
import { SavePageToDevice } from "./SavePageToDevice";
import { PageEditor, PageTemplate } from "@/assets/scripts/PageEditor";

/**
 * Loads an empty page into the application.
 * @param context
 *  The application's context.
 * @param template
 *  The page's template.
 * @returns
 *  A command that represents the action.
 */
export function loadNewPageFile(context: ApplicationStore, template: PageTemplate): AppCommand {
    let page = PageEditor.createNew(template);
    return new LoadPage(context, page);
}

/**
 * Loads a page file export into the application.
 * @param context
 *  The application's context.
 * @param file
 *  The page export.
 * @returns
 *  A command that represents the action.
 */
export function loadPageFromFile(context: ApplicationStore, file: string): AppCommand {
    let contents = JSON.parse(file);
    // Resolve Template
    let id = contents.__document.template_identifier;
    if(id === undefined) {
        throw new Error("Malformed export file.")
    }
    let template = Configuration.templates.find(o => o.id === id);
    if(!template) {
        throw new Error(`Application does not support file template '${ id }'.`);
    }
    // Load Page
    let page = PageEditor.fromFile(template, contents);
    return new LoadPage(context, page);
}

/**
 * Loads a page file from the file system, into the application.
 * @param context
 *  The application's context.
 * @returns
 *  A command that represents the action.
 */
export async function loadPageFromFileSystem(context: ApplicationStore): Promise<AppCommand> {
    return loadPageFromFile(context, (await Browser.openTextFileDialog()).contents as string);
}

/**
 * Loads a page file from a remote url, into the application.
 * @param context
 *  The application's context.
 * @param url
 *  The remote url.
 * @returns
 *  A command that represents the action.
 */
export async function loadPageFromUrl(context: ApplicationStore, url: string): Promise<AppCommand> {
    return loadPageFromFile(context, await (await fetch(url, { credentials: "omit" })).text());
}

/**
 * Unloads a page out of the application.
 * @param context
 *  The application's context.
 * @param id
 *  The page editor's id.
 * @returns
 *  A command that represents the action.
 */
export function unloadPage(context: ApplicationStore, id: string): AppCommand {
    return new UnloadPage(context, id)
}

/**
 * Switches the application's active page.
 * @param context
 *  The application's context.
 * @param id
 *  The page editor's id.
 * @returns
 *  A command that represents the action.
 */
export function switchActivePage(context: ApplicationStore, id: string): AppCommand {
    return new SwitchActivePage(context, id);
}

/**
 * Saves a page to the user's file system.
 * @param context
 *  The application's context.
 * @param id
 *  The page editor's id.
 * @returns
 *  A command that represents the action.
 */
export function savePageToDevice(context: ApplicationStore, id: string): AppCommand {
    return new SavePageToDevice(context, id);
}
