import { ITabularProperty, TabularPropertyEvents } from "../TabularProperty/ITabularProperty";

export interface IComplexTableProperty extends ITabularProperty {

    /**
     * The data region's layout.
     */
    readonly layout: {

        /**
         * The data region's summary template.
         */
        readonly summary: string;

        /**
         * The number of rows in each data region.
         */
        readonly rows: number;

        /**
         * The number of columns in each data region.
         */
        readonly cols: number;
    
    }

    /**
     * The table row's collapsed state.
     */
    get collapsed(): ReadonlyMap<string, boolean>


    ///////////////////////////////////////////////////////////////////////////
    //  1. Value Manipulation  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Collapses a row.
     * @param id
     *  The row's id.
     * @param collapse
     *  True to collapse, false to uncollapse. 
     */
    setRowCollapse(id: string, collapse: boolean): void;
    
    
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
    on<K extends keyof ComplexTablePropertyEvents>(event: K, callback: ComplexTablePropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof ComplexTablePropertyEvents>(event: K, callback: ComplexTablePropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof ComplexTablePropertyEvents>(event?: K): void;

}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Event types
export interface ComplexTablePropertyEvents extends TabularPropertyEvents {
    "row-collapse"   : (id: string) => void,
    "row-uncollapse" : (id: string) => void
}
