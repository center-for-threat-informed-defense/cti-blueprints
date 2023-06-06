
import { ComplexTablePropertyLayout } from "./ComplexTablePropertyLayout";
import {
    AtomicProperty,
    ComplexTablePropertyParameters,
    TabularProperty,
    TabularPropertyAssembler
} from "..";

export class ComplexTableProperty extends TabularProperty {
    
    /**
     * The data region's layout.
     */
    public readonly layout: ComplexTablePropertyLayout

    /**
     * The table row's collapsed state.
     */
    private _collapsed: Map<string, boolean>;


    /**
     * The table row's collapsed state.
     */
    public get collapsed(): ReadonlyMap<string, boolean> {
        return this._collapsed;
    }


    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: ComplexTablePropertyParameters);
    
    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: ComplexTablePropertyParameters, assembler?: TabularPropertyAssembler);
    constructor(params: ComplexTablePropertyParameters, assembler?: TabularPropertyAssembler) {
        super(params, assembler);
        this.layout = {
            summary: params.layout.summary,
            rows: params.layout.rows,
            cols: params.layout.cols
        };
        this._collapsed = new Map();
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Row Collapse Management  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Inserts a row into the table property.
     * @param row
     *  The row to insert.
     * @param index
     *  The row's index.
     * @throws { Error }
     *  If `row` does not match the table's structure.
     */
    public override insertRow(row: [string, AtomicProperty[]], index?: number) {
        // Update collapsed state
        this._collapsed.set(row[0], true);
        // Insert row
        super.insertRow(row, index);
    }

    /**
     * Removes a row from the table property.
     * @param index
     *  The row's index.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public override deleteRow(index: number): boolean;

    /**
     * Removes a row from the table property.
     * @param id
     *  The row's id.
     * @returns
     *  True if the row was removed, false otherwise.
     */
    public override deleteRow(id: string): boolean;
    public override deleteRow(_: string | number): boolean {
        // Update collapsed state
        if(typeof _ === "number") {
            _ = [...this._value.keys()][_];
        }
        if(_ !== undefined) {
            this._collapsed.delete(_);
        }
        // Delete row
        return super.deleteRow(_);
    }

    /**
     * Collapses a row.
     * @param id
     *  The row's id.
     * @param collapse
     *  True to collapse, false to uncollapse. 
     */
    public setRowCollapse(id: string, collapse: boolean) {
        if(this._collapsed.has(id)) {
            this._collapsed.set(id, collapse);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): ComplexTableProperty

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: TabularPropertyAssembler): ComplexTableProperty {
        // Create property
        let prop = new ComplexTableProperty({
            id          : this.id,
            name        : this.name,
            path        : this.path,
            link        : this.link,
            row         : this.row,
            col         : this.col,
            layout: {
                cols    : this.layout.cols,
                rows    : this.layout.rows,
                summary : this.layout.summary
            }
        }, assembler);
        // Clone values
        for(let [id, row] of this._value) {
            prop.insertRow([id, row.map(o => o.clone())]);
            prop.setRowCollapse(id, this._collapsed.get(id)!);
        }
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            prop.tryInstallPlugin(plugin);
        });
        // Return
        return prop;
    }

}
