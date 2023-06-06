import { PageCommand } from "../../PageCommand";
import { DateTimeProperty } from "@/assets/scripts/Page";
import { SetDateTimeProperty } from "./SetDateTimeProperty";

/**
 * Sets a datetime property's value.
 * @param prop
 *  The datetime property.
 * @param value
 *  The datetime property's new value.
 * @returns
 *  A command that represents the action.
 */
export function setDateTimeProperty(prop: DateTimeProperty, value: Date | null): PageCommand {
    return new SetDateTimeProperty(prop, value);
}

/**
 * Clears a datetime property's value.
 * @param prop
 *  The datetime property.
 * @returns
 *  A command that represents the action.
 */
export function clearDateTimeProperty(prop: DateTimeProperty): PageCommand {
    return new SetDateTimeProperty(prop, null);
}
