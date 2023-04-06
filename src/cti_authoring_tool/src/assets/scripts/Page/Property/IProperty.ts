import { PropertyType } from "../../AppConfiguration";

export interface IProperty {

    /**
     * The property's id.
     */
    readonly id: string;

    /**
     * The property's name.
     */
    readonly name: string;

    /**
     * The property's type.
     */
    readonly type: PropertyType;

    /**
     * The property's primary status.
     */
    readonly isPrimary: boolean;

    /**
     * The property's row position.
     */
    readonly row: Readonly<number> | ReadonlyArray<number>;

    /**
     * The property's column position.
     */
    readonly col: Readonly<number> | ReadonlyArray<number>;

    
    /**
     * Adds an event listener to the property.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired.
     */
    on<K extends keyof PropertyEvents>(event: K, callback: PropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof PropertyEvents>(event: K, callback: PropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof PropertyEvents>(event?: K): void;

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    toString(): string | undefined;

}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Event types
export interface PropertyEvents {
    "mount"   : (el: HTMLElement) => void,
    "destroy" : () => void
}
