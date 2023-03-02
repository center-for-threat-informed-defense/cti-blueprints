import { AppCommand } from "../AppCommand";
import { ApplicationStore } from "@/store/StoreTypes";

export class SwitchToFullscreen extends AppCommand {

    /**
     * Switches the application to fullscreen mode.
     * @param context
     *  The application context.
     */
    constructor() {
        super();
    }

    /**
     * Executes the command.
     */
    public execute(): void {
        let cast = document.body as any;
        if (cast.requestFullscreen) {
            cast.requestFullscreen();
        } else if (cast.webkitRequestFullscreen) {
            // Safari
            cast.webkitRequestFullscreen();
        } else if (cast.msRequestFullscreen) {
            // IE11
            cast.msRequestFullscreen();
        }
    }

}
