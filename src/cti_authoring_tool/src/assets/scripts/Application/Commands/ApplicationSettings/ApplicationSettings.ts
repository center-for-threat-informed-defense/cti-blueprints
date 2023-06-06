import { ApplicationStore } from "@/store/StoreTypes";
import { AppCommand } from "../AppCommand";
import { LoadSettings } from "./LoadSettings";
import { AppSettings } from "@/assets/scripts/Application/AppSettings";

/**
 * Loads the application's settings.
 * @param context
 *  The application's context.
 * @param settings
 *  The application's settings.
 * @returns
 *  A command that represents the action.
 */
export function loadSettings(context: ApplicationStore, settings: AppSettings): AppCommand {
   return new LoadSettings(context, settings); 
}