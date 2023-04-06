import { AtomicPropertyEvents, IAtomicProperty } from "../AtomicProperty/IAtomicProperty";

export interface IStringProperty extends IAtomicProperty {

    /**
     * The property's value.
     */
    readonly value: string | null;

    /**
     * The property's string suggestions.
     */
    readonly suggestions: ReadonlyArray<string>;


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
    //  2. Action / Metrics Registration  /////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Registers a property action.
     * @param name
     *  The action's name.
     * @param action
     *  The action.
     */
    registerAction(name: string, action: () => void): void;

    /**
     * Registers a property metric.
     * @param name
     *  The metric's name.
     * @param metric
     *  The metric.
     */
    registerMetric(name: string, metric: () => any): void;


    ///////////////////////////////////////////////////////////////////////////
    //  3. Events  ////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Adds an event listener to the property.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired.
     */
    on<K extends keyof StringPropertyEvents>(event: K, callback: StringPropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof StringPropertyEvents>(event: K, callback: StringPropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof StringPropertyEvents>(event?: K): void;


    ///////////////////////////////////////////////////////////////////////////
    //  4. toString  //////////////////////////////////////////////////////////
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
export interface StringPropertyEvents extends AtomicPropertyEvents {
    "update" : (newValue: string, oldValue: string) => void
}
