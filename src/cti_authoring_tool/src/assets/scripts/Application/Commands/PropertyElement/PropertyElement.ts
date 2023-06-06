import { AppCommand } from "../AppCommand";
import { MountProperty } from "./MountProperty";
import { DestroyProperty } from "./DestroyProperty";
import { InvokePropertyAction } from "./InvokePropertyAction";
import { SelectAtomicProperty } from "./SelectAtomicProperty";
import { DeselectAtomicProperty } from "./DeselectAtomicProperty";
import { AtomicProperty, Property } from "@/assets/scripts/Page";

/**
 * Mounts a property to the DOM.
 * @param prop
 *  The property.
 * @param el
 *  The property's HTML container.
 * @returns
 *  A command that represents the action.
 */
export function mountProperty(prop: Property, el: HTMLElement): AppCommand {
    return new MountProperty(prop, el);
}

/**
 * Removes a property from the DOM.
 * @param prop
 *  The property.
 * @returns
 *  A command that represents the action.
 */
export function destroyProperty(prop: Property) {
    return new DestroyProperty(prop);
}

/**
 * Invokes a property's action.
 * @param prop
 *  The property.
 * @param id
 *  The action's id.
 * @returns
 *  A command that represents the action.
 */
export function invokePropertyAction(prop: Property, id: string): AppCommand {
    return new InvokePropertyAction(prop, id);
}

/**
 * Selects an atomic property from the DOM.
 * @param prop
 *  The atomic property.
 * @returns
 *  A command that represents the action.
 */
export function selectAtomicProperty(prop: AtomicProperty): AppCommand {
    return new SelectAtomicProperty(prop);
}

/**
 * Deselects an atomic property from the DOM.
 * @param prop
 *  The atomic property.
 * @returns
 *  A command that represents the action.
 */
export function deselectAtomicProperty(prop: AtomicProperty): AppCommand {
    return new DeselectAtomicProperty(prop);
}
