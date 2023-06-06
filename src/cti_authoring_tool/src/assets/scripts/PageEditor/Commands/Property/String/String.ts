import { PageCommand } from "../../PageCommand";
import { StringProperty } from "@/assets/scripts/Page";
import { SetStringProperty } from "./SetStringProperty";

/**
 * Sets a string property's value.
 * @param prop
 *  The string property.
 * @param value
 *  The string property's new value.
 * @returns
 *  A command that represents the action.
 */
export function setStringProperty(prop: StringProperty, value: string | null): PageCommand {
    return new SetStringProperty(prop, value);
}

/**
 * Clears a string property's value.
 * @param prop
 *  The string property.
 * @returns
 *  A command that represents the action.
 */
export function clearStringProperty(prop: StringProperty): PageCommand {
    return new SetStringProperty(prop, null);
}
