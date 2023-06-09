import { PageCommand } from "../../PageCommand";
import { AtomicProperty } from "@/assets/scripts/Page";
import { SelectAtomicProperty } from "./SelectAtomicProperty";
import { DeselectAtomicProperty } from "./DeselectAtomicProperty";

/**
 * Selects an atomic property.
 * @param prop
 *  The property to select.
 * @returns
 *  A command that represents the action.
 */
export function selectAtomicProperty(prop: AtomicProperty): PageCommand {
    return new SelectAtomicProperty(prop);
}

/**
 * Deselects an atomic property.
 * @param prop
 *  The property to deselect.
 * @returns
 *  A command that represents the action.
 */
export function deselectAtomicProperty(prop: AtomicProperty): PageCommand {
    return new DeselectAtomicProperty(prop)
}
