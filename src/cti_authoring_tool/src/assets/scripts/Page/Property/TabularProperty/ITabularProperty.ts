import { Sort } from "./Sort";
import { ColumnSnapshot } from "./ColumnSnapshot";
import { IAtomicProperty } from "../AtomicProperty/IAtomicProperty";
import { TablePropertyState } from "./TablePropertyState";
import { IProperty, PropertyEvents } from "../IProperty";

export interface ITabularProperty extends IProperty {

    /**
     * The property's value.
     */
    get value(): Map<string, IAtomicProperty[]>;

    /**
     * The table's property state.
     */
    get properties(): TablePropertyState[];


    ///////////////////////////////////////////////////////////////////////////
    //  1. Value Manipulation  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a row's id.
     * @param index
     *  The row's index.
     * @returns
     *  The row's id, undefined if no row at `index`.
     */
    getId(index: number): string | undefined;

    /**
     * Returns a row's index.
     * @param id
     *  The row's id.
     * @returns
     *  The row's index, -1 if no row matches `id`.
     */
    getIndex(id: string): number;

    /**
     * Creates a new table row.
     * @returns
     *  The row's id and properties.
     * @throws { Error }
     *  If the table's `template` defines a non-atomic property.
     */
    createRow(): [string, IAtomicProperty[]];
    
    /**
     * Creates a new table row from a set of values.
     * @returns
     *  The row's id and properties.
     * @param values
     *  The row's values.
     * @throws { Error }
     *  If the table's `template` defines a non-atomic property.
     */
    createRow(values: { [key: string]: any }): [string, IAtomicProperty[]];

    /**
     * Inserts a row into the table property.
     * @param row
     *  The row to insert.
     * @param index
     *  The row's index.
     * @throws { Error }
     *  If `row` does not match the table's property schema.
     */
    insertRow(row: [string, IAtomicProperty[]], index?: number): void;

    /**
     * Moves a row to another location in the table.
     * @param src
     *  The row's current index.
     * @param dst
     *  The row's new index.
     */
    moveRow(src: number, dst: number): void;

    /**
     * Removes a row from the table property.
     * @param index
     *  The row's index.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    deleteRow(index: number): boolean;

    /**
     * Removes a row from the table property.
     * @param id
     *  The row's id.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    deleteRow(id: string): boolean;

    /**
     * Captures a snapshot of a column.
     * @param id
     *  The column's id.
     * @returns
     *  The column snapshot.
     */
    captureColumnSnapshot(id: string): ColumnSnapshot;
    
    /**
     * Captures a snapshot of a column with the given sort order applied.
     * @param id
     *  The column's id.
     * @param sort
     *  The sort order to use.
     * @returns
     *  The column snapshot.
     * @throws { Error }
     *  If column does not exist.
     *  If column properties mismatch column type.
     *  If column is a non-atomic property type. 
     */
    captureColumnSnapshot(id: string, sort: Sort): ColumnSnapshot;

    /**
     * Applies a column snapshot to the table.
     * @param snapshot
     *  The snapshot to apply.
     * @throws { Error }
     *  If the snapshot does not align with the table's current state.
     *  If the snapshot's column doesn't exist within the table.
     */
    applyColumnSnapshot(snapshot: ColumnSnapshot): void;

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
    on<K extends keyof TabularPropertyEvents>(event: K, callback: TabularPropertyEvents[K]): void;

    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    once<K extends keyof TabularPropertyEvents>(event: K, callback: TabularPropertyEvents[K]): void;

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    removeAllListeners<K extends keyof TabularPropertyEvents>(event?: K): void;


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
export interface TabularPropertyEvents extends PropertyEvents {
    "select"   : (property: IAtomicProperty) => void,
    "deselect" : (property: IAtomicProperty) => void,
    "update"   : (property: IAtomicProperty, value: any) => void
}
