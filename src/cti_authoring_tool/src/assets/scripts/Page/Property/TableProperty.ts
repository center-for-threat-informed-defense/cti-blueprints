import { Crypto } from "../../Utilities/Crypto";
import { PageSection } from "../PageSection";
import { PageAtomicPropertyTemplate, PropertyType, Sort, TablePropertyTemplate } from "../../AppConfiguration";
import { AtomicProperty, DateProperty, NumberProperty, Property, StringProperty } from ".";

export class TableProperty extends Property {

    /**
     * The property's value.
     */
    public value: Map<string, AtomicProperty[]>;

    /**
     * The table's number of columns.
     */
    public columns: number;

    /**
     * The table's header.
     */
    public header: PageAtomicPropertyTemplate[];


    /**
     * Creates a new {@link TableProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: TablePropertyTemplate) {
        super(section, template);
        this.value = new Map();
        this.header = [];
        this.columns = template.table_columns.number;
        // Configure header
        let templates = template.table_columns.properties
        for(let template of templates) {
            this.header.push({
                sort: Sort.None,
                ...structuredClone(template)
            });
        }
        // Configure values
        for(let values of template.default ?? []) {
            let row: AtomicProperty[] = [];
            for(let template of templates) {
                let prop = Property.create(section, template, values[template.id]);
                if(prop instanceof AtomicProperty) {
                    row.push(prop);
                } else {
                    throw new Error(`'${ prop.id }' is not an atomic property.`);
                }
            }
            this.value.set(Crypto.randomUUID(), row);
        }
    }


    /**
     * Returns a row's id.
     * @param index
     *  The row's index.
     * @returns
     *  The row's id, undefined if no row at `index`.
     */
    public getId(index: number): string | undefined {
        return [...this.value.keys()][index];
    }

    /**
     * Returns a row's index.
     * @param id
     *  The row's id.
     * @returns
     *  The row's index, -1 if no row matches `id`.
     */
    public getIndex(id: string): number {
        return [...this.value.keys()].findIndex(o => o === id);
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
        if(this.value.has(id)) {
            result = [id, this.value.get(id)!]
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
    public createRow(): [string, AtomicProperty[]] {
        let row = [];
        for(let template of this.header) {
            let prop = Property.create(this._section, template);
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
        for(let template of this.header) {
            // TODO: Need better comparison
            let p = row[1].find(o => o.id === template.id);
            if(p) {
                props.push(p);
            } else {
                throw Error("Row does not match the table's property schema.")
            }
        }
        // Insert row
        if(index) {
            let v = [...this.value.entries()];
            v.splice(index, 0, [row[0], props]);
            this.value = new Map(v);
        } else {
            this.value.set(row[0], props);
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
        let rows = [...this.value.entries()]
        // Move row
        rows.splice(dst, 0, rows.splice(src, 1)[0]);
        // Update rows
        this.value = new Map(rows);
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
        if(typeof _ === "string") {
            return this.value.delete(_);
        } else if(0 <= _ && _ < this.value.size) {
            let v = [...this.value.entries()];
            v.splice(_, 1);
            this.value = new Map(v);
            return true;
        } else {
            return false;
        }
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
        let column = this.header.findIndex(o => o.id === id);
        if(column === -1) {
            throw new Error(`Column '${ id }' does not exist.`);
        }
        // If no sort order, capture as is
        if(sort === undefined) {
            return {
                id: this.header[column].id,
                sort: this.header[column].sort!,
                ids: [...this.value.keys()]
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
        switch(this.header[column].type) {
            case PropertyType.String:
                ids = [...this.value.keys()].sort((a,b) => {
                    let rowA = this.value.get(a)![column];
                    let rowB = this.value.get(b)![column];
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
                ids = [...this.value.keys()].sort((a,b) => {
                    let rowA = this.value.get(a)![column];
                    let rowB = this.value.get(b)![column];
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
                ids = [...this.value.keys()].sort((a,b) => {
                    let rowA = this.value.get(a)![column];
                    let rowB = this.value.get(b)![column];
                    if(
                        rowA instanceof DateProperty && 
                        rowB instanceof DateProperty
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
                ids = [...this.value.keys()];
                break;
            default:
                throw new Error(`Cannot sort non-atomic property type.`);
        }
        return { id: this.header[column].id, sort, ids }
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
        let isValid = this.value.size === snapshot.ids.length;
        for(let id of snapshot.ids) {
            isValid &&= this.value.has(id);
        }
        if(!isValid) {
            throw new Error("Invalid snapshot.")
        }
        // Resolve column
        let id = snapshot.id;
        let column = this.header.find(o => o.id === id);
        if(!column) {
            throw new Error(`Column '${ id }' does not exist.`);
        }
        // Apply sort state
        column.sort = snapshot.sort;
        // Apply row ordering
        let order: [string, AtomicProperty[]][] = [];
        for(let id of snapshot.ids) {
            order.push([id, this.value.get(id)!]);
        }
        this.value = new Map(order);
    }

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public toString(): string | undefined {
        let primaryColumn = this.header.findIndex(o => o.is_primary);
        if(primaryColumn === -1 || this.value.size === 0) {
            return undefined;
        }
        let name = [...this.value.values()]  
            .map(o => o[primaryColumn].toString())
            .filter(Boolean)
            .join(", ")
        return name || undefined;
    }

}

export type ColumnSnapshot = {

    /**
     * The id of the column.
     */
    id: string;

    /**
     * The column's sort order.
     */
    sort: Sort;

    /**
     * The column's current ordering.
     */
    ids: string[];

}
