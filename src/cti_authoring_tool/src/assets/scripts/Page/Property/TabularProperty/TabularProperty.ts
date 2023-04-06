import { PageSection } from "../../PageSection";
import { Crypto, String } from "@/assets/scripts/Utilities";
import { ColumnSnapshot } from "./ColumnSnapshot";
import { ITabularProperty } from "./ITabularProperty";
import { AtomicPagePropertyTemplate, PropertyType, TabularPropertyRowValue, TabularPropertyTemplate } from "../../../AppConfiguration";
import { AtomicProperty, DateTimeProperty, EnumProperty, NumberProperty, Property, Sort, StringProperty, TablePropertyState } from "..";

export abstract class TabularProperty extends Property implements ITabularProperty {

    // TODO: Consume update events from child properties

    /**
     * The property's value.
     */
    public get value(): Map<string, AtomicProperty[]> {
        return new Map([...this._value]);
    } 

    /**
     * The property's (internal) value.
     */
    protected _value: Map<string, AtomicProperty[]>;

    /**
     * The table's property state.
     */
    public get properties(): TablePropertyState[] {
        return [...this._properties];
    }

    /**
     * The table's (internal) property state.
     */
    protected _properties: TablePropertyState[];

    /**
     * The table's property templates.
     */
    protected readonly _templates: AtomicPagePropertyTemplate[];


    /**
     * Creates a new {@link TabularProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: TabularPropertyTemplate);

    /**
     * Creates a new {@link TabularProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: TabularPropertyTemplate, value: TabularPropertyRowValue[]);
    constructor(section: PageSection, template: TabularPropertyTemplate, value?: TabularPropertyRowValue[]) {
        super(section, template);
        this._value = new Map();
        this._templates = [];
        this._properties = [];
        // Configure header
        let templates = template.properties;
        for(let t of templates) {
            this._templates.push(structuredClone(t));
            this._properties.push({
                id   : t.id ?? String.formatId(t.name),
                name : t.name,
                sort : Sort.None,
                col  : Array.isArray(t.col) ? [...t.col] : t.col,
                row  : Array.isArray(t.row) ? [...t.row] : t.row,
            });
        }
        // Configure values
        if(value !== undefined) {
            for(let v of value) {
                this.insertRow(this.createRow(v));
            }
        } else if(template.default !== undefined) {
            for(let v of template.default) {
                this.insertRow(this.createRow(v));
            }
        }
        // Initialize Plugins
        this.initializePlugins(template);
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. ITabularProperty Methods  /////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a row's id.
     * @param index
     *  The row's index.
     * @returns
     *  The row's id, undefined if no row at `index`.
     */
    public getId(index: number): string | undefined {
        return [...this._value.keys()][index];
    }

    /**
     * Returns a row's index.
     * @param id
     *  The row's id.
     * @returns
     *  The row's index, -1 if no row matches `id`.
     */
    public getIndex(id: string): number {
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
     * @throws { Error }
     *  If the table's `template` defines a non-atomic property.
     */
    public createRow(): [string, AtomicProperty[]];
    
    /**
     * Creates a new table row from a set of values.
     * @returns
     *  The row's id and properties.
     * @param values
     *  The row's values.
     * @throws { Error }
     *  If the table's `template` defines a non-atomic property.
     */
    public createRow(values: { [key: string]: any }): [string, AtomicProperty[]];
    public createRow(values?: { [key: string]: any }): [string, AtomicProperty[]] {
        let row = [];
        for(let template of this._templates) {
            let value = values && template.id && values[template.id];
            let prop = Property.create(this._section, template, value);
            if(prop instanceof AtomicProperty) {
                row.push(prop);
            } else {
                throw new Error(`'${ prop.id }' is not an atomic property.`);
            }
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
     *  If `row` does not match the table's property schema.
     */
    public insertRow(row: [string, AtomicProperty[]], index?: number) {
        // Create row
        let props: AtomicProperty[] = [];
        for(let template of this._templates) {
            // TODO: Need better comparison
            let p = row[1].find(o => o.id === template.id);
            if(p) {
                props.push(p);
            } else {
                throw Error("Row does not match the table's property schema.")
            }
        }
        // Insert row
        if(index === undefined) {
            this._value.set(row[0], props);
        } else {
            let v = [...this._value.entries()];
            v.splice(index, 0, [row[0], props]);
            this._value = new Map(v);
        }
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
    public deleteRow(_: string | number): boolean {
        if(typeof _ === "number") {
            _ = [...this._value.keys()][_]   
        }
        return _ !== undefined ? this._value.delete(_) : false;
    }

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
        let column = this._properties.findIndex(o => o.id === id);
        if(column === -1) {
            throw new Error(`Column '${ id }' does not exist.`);
        }
        // If no sort order, capture as is
        if(sort === undefined) {
            return {
                id: this._properties[column].id,
                sort: this._properties[column].sort,
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
                break;
            case Sort.None:
                dir = 0;
                break;
        }
        switch(this._templates[column].type) {
            case PropertyType.String:
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
            case PropertyType.Float:
            case PropertyType.Integer:
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
            case PropertyType.Date:
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
            case PropertyType.Enum:
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
        return { id: this._templates[column].id!, sort, ids }
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
        let column = this._properties.find(o => o.id === id);
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
    }

    /**
     * Creates a new command.
     */
    newCommand(): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Registers a property action.
     * @param name
     *  The action's name.
     * @param action
     *  The action.
     */
    registerAction(name: string, action: () => void): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string | undefined {
        let primaryColumn = this._templates.findIndex(o => o.is_primary);
        if(primaryColumn === -1 || this._value.size === 0) {
            return undefined;
        }
        let name = [...this._value.values()]  
            .map(o => o[primaryColumn].toString())
            .filter(Boolean)
            .join(", ")
        return name || undefined;
    }

}
