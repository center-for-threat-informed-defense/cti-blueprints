import { PageCommand } from "../../PageCommand";
import { EnumProperty } from "@/assets/scripts/Page";
import { SetEnumProperty } from "./SetEnumProperty";

/**
 * Sets a enum property's value.
 * @param prop
 *  The enum property.
 * @param value
 *  The enum property's new value.
 * @returns
 *  A command that represents the action.
 */
export function setEnumProperty(prop: EnumProperty, value: string | null): PageCommand {
    return new SetEnumProperty(prop, value);
}

/**
 * Clears a enum property's value.
 * @param prop
 *  The enum property.
 * @returns
 *  A command that represents the action.
 */
export function clearEnumProperty(prop: EnumProperty): PageCommand {
    return new SetEnumProperty(prop, null);
}
