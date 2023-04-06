import { IProperty } from "./Property/IProperty";

export interface IPageSection {

    /**
     * The section's id.
     */
    readonly id: string;

    /**
     * The section's name.
     */
    readonly name: string;

    /**
     * The section's layout.
     */
    readonly layout: {
        
        /**
         * The number of rows in the section.
         */
        rows: number,

        /**
         * The number of columns in the section.
         */
        cols: number
    
    };

    /**
     * The section's properties.
     */
    readonly properties: Map<string, IProperty>;

    /**
     * The section's primary status.
     */
    readonly isPrimary: boolean;


    
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
    "mount"    : (el: HTMLElement) => void,
    "destroy"  : () => void,
    "select"   : (property: IProperty) => void,
    "deselect" : (property: IProperty) => void,
    "update"   : (property: IProperty) => void
}
