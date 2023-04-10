import { AtomicPropertyEvents, IAtomicProperty } from "../AtomicProperty/IAtomicProperty";

export interface IEnumProperty extends IAtomicProperty {

    /**
     * The property's value.
     */
    readonly value: string | null;

    /**
     * The property's set of options.
     */
    readonly options: ReadonlyMap<string, { text: string, value: any }>;

    
    ///////////////////////////////////////////////////////////////////////////
    //  1. Value Manipulation  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    
    
    /**
     * Sets the property's value directly.
     * @param value
     *  The property's new value.
     */
    setValue(value: string | null): void;

    /**
     * Creates a new command.
     */
    newCommand(): void;

    
    ///////////////////////////////////////////////////////////////////////////
    //  2. Events  ////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Adds an event listener to the property.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired.
     */
    on<K extends keyof EnumPropertyEvents>(event: K, callback: EnumPropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof EnumPropertyEvents>(event: K, callback: EnumPropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof EnumPropertyEvents>(event?: K): void;

    
    ///////////////////////////////////////////////////////////////////////////
    //  3. toString  //////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    toString(): string | undefined

}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Event types
export interface EnumPropertyEvents extends AtomicPropertyEvents {
    "update" : (newValue: any, oldValue: any) => void
}
