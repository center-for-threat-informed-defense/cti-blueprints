import { PageCommand } from "../../PageCommand";
import { NumberProperty } from "@/assets/scripts/Page";
import { SetNumberProperty } from "./SetNumberProperty";

/**
 * Sets a number property's value.
 * @param prop
 *  The number property.
 * @param value
 *  The number property's new value.
 * @returns
 *  A command that represents the action.
 */
export function setNumberProperty(prop: NumberProperty, value: number | null): PageCommand {
    return new SetNumberProperty(prop, value);
}

/**
 * Clears a number property's value.
 * @param prop
 *  The number property.
 * @returns
 *  A command that represents the action.
 */
export function clearNumberProperty(prop: NumberProperty): PageCommand {
    return new SetNumberProperty(prop, null);
}
