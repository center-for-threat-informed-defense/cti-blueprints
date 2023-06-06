import { AppCommand } from "../AppCommand";
import { OpenHyperlink } from "./OpenHyperlink"
import { SwitchToFullscreen } from "./SwitchToFullscreen";

/**
 * Opens an external hyperlink.
 * @param url
 *  The hyperlink's url.
 * @returns
 *  A command that represents the action.
 */
export function openHyperlink(url: string): AppCommand {
    return new OpenHyperlink(url);
}

/**
 * Switches the application to fullscreen mode.
 * @returns
 *  A command that represents the action.
 */
export function switchToFullscreen(): AppCommand {
    return new SwitchToFullscreen();
}
