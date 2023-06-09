import { AppCommand } from "../AppCommand";
import { AppSettings } from "@/assets/scripts/Application";
import { ApplicationStore } from "@/store/StoreTypes";

export class LoadSettings extends AppCommand {

    /**
     * The application's settings.
     */
    private _settings: AppSettings;

    /**
     * The application context.
     */
    private _context: ApplicationStore;


    /**
     * Configures the application's settings.
     * @param context
     *  The application context.
     * @param settings
     *  The application's settings.
     */
    constructor(context: ApplicationStore, settings: AppSettings) {
        super();
        this._context = context;
        this._settings = settings;
    }


    /**
     * Executes the command.
     */
    public execute(): void {
        this._context.settings = this._settings; 
    }

}
