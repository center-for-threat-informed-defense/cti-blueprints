import { AppCommand } from "../AppCommand";
import { UndoPageCommand } from "./UndoPageCommand";
import { RedoPageCommand } from "./RedoPageCommand";
import { ApplicationStore } from "@/store/StoreTypes";

/**
 * Undoes the last page command.
 * @param context
 *  The application's context.
 * @param id
 *  The page editor's id.
 * @returns
 *  A command that represents the action.
 */
export function undoPageCommand(context: ApplicationStore, id: string): AppCommand {
    return new UndoPageCommand(context, id);
}

/**
 * Redoes the last undone page command.
 * @param context
 *  The application's context.
 * @param id
 *  The page editor's id.
 * @returns
 *  A command that represents the action.
 */
export function redoPageCommand(context: ApplicationStore, id: string): AppCommand {
    return new RedoPageCommand(context, id);
}
