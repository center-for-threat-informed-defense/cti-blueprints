import { Alignment } from "@/assets/scripts/AppConfiguration";
import { IProperty, PropertyEvents } from "../IProperty";

export interface IAtomicProperty extends IProperty {

    /**
     * If the property is required or not.
     */
    readonly required: boolean;

    /**
     * The property's alignment.
     */
    readonly alignment: Alignment;
    
    
    ///////////////////////////////////////////////////////////////////////////
    //  1. Metric Registration  ///////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Registers a property metric.
     * @param name
     *  The metric's name.
     * @param metric
     *  The metric.
     */
    registerMetric(name: string, metric: () => any): void;


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
    on<K extends keyof AtomicPropertyEvents>(event: K, callback: AtomicPropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof AtomicPropertyEvents>(event: K, callback: AtomicPropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof AtomicPropertyEvents>(event?: K): void;

}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Event types
export interface AtomicPropertyEvents extends PropertyEvents {
    "select"   : () => void,
    "deselect" : () => void
}
