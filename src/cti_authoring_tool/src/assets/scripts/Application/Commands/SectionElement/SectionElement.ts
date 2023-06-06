import { Section } from "@/assets/scripts/Page";
import { AppCommand } from "../AppCommand";
import { MountSection } from "./MountSection";
import { DestroySection } from "./DestroySection";

/**
 * Mounts a page section to the DOM.
 * @param section
 *  The page section.
 * @param el
 *  The section's HTML container.
 * @returns
 *  A command that represents the action.
 */
export function mountSection(section: Section, el: HTMLElement): AppCommand {
    return new MountSection(section, el);
}

/**
 * Removes a page section from the DOM.
 * @param section
 *  The page section.
 * @returns
 *  A command that represents the action.
 */
export function destroySection(section: Section) {
    return new DestroySection(section);
}
