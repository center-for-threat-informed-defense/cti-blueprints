import * as Crypto from "@/assets/scripts/Utilities";
import { ColumnSnapshot } from "./ColumnSnapshot";
import { PlugableElement } from "../../PlugableElement";
import { PropertyParameters } from "../PropertyParameters";
import { Plugin, PluginManager } from "../../Plugins";
import { TabularPropertyAssembler } from "./TabularPropertyAssembler";
import {
    Sort,
    Property,
    PropertyAssembler, 
    AtomicProperty,
    EnumProperty,
    TimeProperty,
    DateProperty,
    DateTimeProperty,
    FloatProperty,
    IntegerProperty,
    NumberProperty,
    StringProperty,
    TableColumnState
} from "..";

export abstract class TabularProperty extends Property {

    /**
     * The property's value.
     */
    protected _value: Map<string, AtomicProperty[]>;
    
    /**
     * The table's default row.
     */
    protected _defaultRow: AtomicProperty[];

    /**
     * The table's column state.
     */
    protected _columnState: TableColumnState[];

    
    /**
     * The property's value.
     */
    public get value(): ReadonlyMap<string, AtomicProperty[]> {
        return this._value;
    }

    /**
     * The table's default row.
     */
    public get defaultRow(): ReadonlyArray<AtomicProperty> {
        return this._defaultRow;
    }

    /**
     * The table's column state.
     */
    public get columnState(): ReadonlyArray<TableColumnState> {
        return this._columnState;
    }

    
    /**
     * Creates a new {@link TabularProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: PropertyParameters);

    /**
     * Creates a new {@link TabularProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: PropertyParameters, assembler?: TabularPropertyAssembler);
    constructor(params: PropertyParameters, assembler?: TabularPropertyAssembler) {
        super(params, assembler);
        this._value = new Map();
        this._defaultRow = [];
        this._columnState = [];
        if(assembler) {
            this.__prepareAssembler(assembler);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Row Management  ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a row's id.
     * @param index
     *  The row's index.
     * @returns
     *  The row's id, undefined if no row at `index`.
     */
    public getRowId(index: number): string | undefined {
        return [...this._value.keys()][index];
    }

    /**
     * Returns a row's index.
     * @param id
     *  The row's id.
     * @returns
     *  The row's index, -1 if no row matches `id`.
     */
    public getRowIndex(id: string): number {
        return [...this._value.keys()].findIndex(o => o === id);
    }

    /**
     * Returns a row from the table property.
     * @param id
     *  The row's id.
     * @returns
     *  The row's id and properties.
     */
    public getRow(id: string): [string, AtomicProperty[]] | undefined {
        let result: [string, AtomicProperty[]] | undefined;
        if(this._value.has(id)) {
            result = [id, this._value.get(id)!]
        }
        return result;
    }

    /**
     * Creates a new table row.
     * @returns
     *  The row's id and properties.
     */
    public createRow(): [string, AtomicProperty[]];
    
    /**
     * Creates a new table row from a set of values.
     * @returns
     *  The row's id and properties.
     * @param values
     *  The row's values.
     */
    public createRow(values?: { [key: string]: any }): [string, AtomicProperty[]];
    public createRow(values?: { [key: string]: any }): [string, AtomicProperty[]] {
        let row = [];
        for(let cell of this._defaultRow) {
            let asm = new PropertyAssembler();
            let prop = cell.clone(asm);
            if(values && cell.id in values) {
                prop.value = values[cell.id];
            }
            row.push(prop);
        }
        return [Crypto.randomUUID(), row];
    }

    /**
     * Inserts a row into the table property.
     * @param row
     *  The row to insert.
     * @param index
     *  The row's index.
     * @throws { Error }
     *  If `row` does not match the table's structure.
     */
    public insertRow(row: [string, AtomicProperty[]], index?: number) {
        let assembler = this.__prepareAssembler();
        // Create row
        let properties: AtomicProperty[] = [];
        for(let cell of this._defaultRow) {
            let property = row[1].find(
                o => o.id === cell.id && o.constructor.name === cell.constructor.name
            );
            if(property) {
                properties.push(property);
            } else {
                throw Error("Row does not match the table's structure.")
            }
        }
        for(let prop of properties) {
            prop.__prepareAssembler().attachToTabularProperty(assembler);
        }
        // Insert row
        if(index === undefined) {
            this._value.set(row[0], properties);
        } else {
            let v = [...this._value.entries()];
            v.splice(index, 0, [row[0], properties]);
            this._value = new Map(v);
        }
        this.emit("insert-row", this, [...properties], row[0]);
    }

    /**
     * Moves a row to another location in the table.
     * @param src
     *  The row's current index.
     * @param dst
     *  The row's new index.
     */
    public moveRow(src: number, dst: number) {
        // Get rows
        let rows = [...this._value.entries()]
        // Move row
        rows.splice(dst, 0, rows.splice(src, 1)[0]);
        // Update rows
        this._value = new Map(rows);
        this.emit("move-row", this, src, dst);
    }

    /**
     * Removes a row from the table property.
     * @param index
     *  The row's index.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public deleteRow(index: number): boolean;

    /**
     * Removes a row from the table property.
     * @param id
     *  The row's id.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public deleteRow(id: string): boolean;
    public deleteRow(id: string | number): boolean {
        // Resolve row
        if(typeof id === "number") {
            id = [...this._value.keys()][id]   
        }
        if(id === undefined || !this._value.has(id)) {
            return false;
        }
        // Remove row
        let row = this._value.get(id)!;
        for(let cell of row) {
            cell.__prepareAssembler().detachFromParent();
        }
        this._value.delete(id);
        this.emit("delete-row", this, row, id);
        return true;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Column Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Captures a snapshot of a column.
     * @param id
     *  The column's id.
     * @returns
     *  The column snapshot.
     */
    public captureColumnSnapshot(id: string): ColumnSnapshot;
    
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
    public captureColumnSnapshot(id: string, sort: Sort): ColumnSnapshot;
    public captureColumnSnapshot(id: string, sort?: Sort): ColumnSnapshot {
        // Resolve column
        let column = this._columnState.findIndex(o => o.id === id);
        if(column === -1) {
            throw new Error(`Column '${ id }' does not exist.`);
        }
        // If no sort order, capture as is
        if(sort === undefined) {
            return {
                id: this._columnState[column].id,
                sort: this._columnState[column].sort,
                ids: [...this._value.keys()]
            }
        }
        // If sort order, capture applied sort order
        let ids: string[];
        let dir: number;
        switch(sort) {
            case Sort.Descending:
                dir = 1;
                break;
            case Sort.Ascending:
                dir = -1
                break;``
            case Sort.None:
                dir = 0;
                break;
        }
        switch(this._defaultRow[column].constructor.name) {
            case StringProperty.name:
                ids = [...this._value.keys()].sort((a,b) => {
                    let rowA = this._value.get(a)![column];
                    let rowB = this._value.get(b)![column];
                    if(
                        rowA instanceof StringProperty && 
                        rowB instanceof StringProperty
                    ) {
                        let valA = rowA.value ?? "";
                        let valB = rowB.value ?? "";
                        return valA.localeCompare(valB) * dir;
                    } else {
                        throw new Error("Properties mismatch column type.");
                    }
                });
                break;
            case FloatProperty.name:
            case IntegerProperty.name:
                ids = [...this._value.keys()].sort((a,b) => {
                    let rowA = this._value.get(a)![column];
                    let rowB = this._value.get(b)![column];
                    if(
                        rowA instanceof NumberProperty && 
                        rowB instanceof NumberProperty
                    ) {
                        let valA = rowA.value ?? 0;
                        let valB = rowB.value ?? 0;
                        return (valA - valB) * dir;
                    } else {
                        throw new Error("Properties mismatch column type.");
                    }
                });
                break;
            case DateProperty.name:
            case TimeProperty.name:
            case DateTimeProperty.name:
                ids = [...this._value.keys()].sort((a,b) => {
                    let rowA = this._value.get(a)![column];
                    let rowB = this._value.get(b)![column];
                    if(
                        rowA instanceof DateTimeProperty && 
                        rowB instanceof DateTimeProperty
                    ) {
                        let valA = rowA.value ?? new Date(0);
                        let valB = rowB.value ?? new Date(0);
                        return (valA.getTime() - valB.getTime()) * dir;
                    } else {
                        throw new Error("Properties mismatch column type.");
                    }
                });
                break;
            case EnumProperty.name:
                ids = [...this._value.keys()].sort((a,b) => {
                    let rowA = this._value.get(a)![column];
                    let rowB = this._value.get(b)![column];
                    if(
                        rowA instanceof EnumProperty && 
                        rowB instanceof EnumProperty
                    ) {
                        let valA = rowA.value?.toString() ?? "";
                        let valB = rowB.value?.toString() ?? "";
                        return valA.localeCompare(valB) * dir;
                    } else {
                        throw new Error("Properties mismatch column type.");
                    }
                });
                break;
            default:
                throw new Error(`Cannot sort non-atomic property type.`);
        }
        return { id: this._defaultRow[column].id, sort, ids }
    }

    /**
     * Applies a column snapshot to the table.
     * @param snapshot
     *  The snapshot to apply.
     * @throws { Error }
     *  If the snapshot does not align with the table's current state.
     *  If the snapshot's column doesn't exist within the table.
     */
    public applyColumnSnapshot(snapshot: ColumnSnapshot) {
        // Validate snapshot
        let isValid = this._value.size === snapshot.ids.length;
        for(let id of snapshot.ids) {
            isValid &&= this._value.has(id);
        }
        if(!isValid) {
            throw new Error("Invalid snapshot.")
        }
        // Resolve column
        let id = snapshot.id;
        let column = this._columnState.find(o => o.id === id);
        if(!column) {
            throw new Error(`Column '${ id }' does not exist.`);
        }
        // Apply sort state
        column.sort = snapshot.sort;
        // Apply row ordering
        let order: [string, AtomicProperty[]][] = [];
        for(let id of snapshot.ids) {
            order.push([id, this._value.get(id)!]);
        }
        this._value = new Map(order);
        this.emit("reorder-row", this);
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  3. toString  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string {
        return "[ Not Supported ]";
        // let primaryColumn = this._templates.findIndex(o => o.is_primary);
        // if(primaryColumn === -1 || this._value.size === 0) {
        //     return undefined;
        // }
        // let name = [...this._value.values()]  
        //     .map(o => o[primaryColumn].toString())
        //     .filter(Boolean)
        //     .join(", ")
        // return name || undefined;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  4. Assembler Preparation  ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Prepares an assembler for the property.
     * @returns
     *  The property's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public override __prepareAssembler(): TabularPropertyAssembler

    /**
     * Prepares an assembler for the property.
     * @param assembler
     *  The assembler to use.
     * @returns
     *  The property's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public override __prepareAssembler(
        assembler?: TabularPropertyAssembler
    ): TabularPropertyAssembler;

    public override __prepareAssembler(
        assembler: TabularPropertyAssembler = new TabularPropertyAssembler()
    ): TabularPropertyAssembler {
        // Prepare property assembler
        super.__prepareAssembler(assembler);
        // Prepare tabular property assembler
        assembler.__injectTabularAccessor({
            property: this,
            setDefaultRow: (row: AtomicProperty[]) => {
                // Reset values
                this._value = new Map();
                // Set default row
                this._defaultRow = row;
                // Set column state
                for(let cell of this._defaultRow) {
                    this._columnState.push({
                        id   : cell.id,
                        name : cell.name,
                        sort : Sort.None,
                        col  : Array.isArray(cell.col) ? [...cell.col] : cell.col,
                        row  : Array.isArray(cell.row) ? [...cell.row] : cell.row,
                    });
                }
            }
        });
        return assembler;
    }

}
