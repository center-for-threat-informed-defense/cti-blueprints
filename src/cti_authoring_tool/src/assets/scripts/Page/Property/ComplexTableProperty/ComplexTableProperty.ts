import { PageSection } from "../../PageSection";
import { IComplexTableProperty } from "./IComplexTableProperty";
import { AtomicProperty, TabularProperty } from "..";
import { ComplexTablePropertyTemplate, TabularPropertyRowValue } from "../../../AppConfiguration";

export class ComplexTableProperty extends TabularProperty implements IComplexTableProperty {
    
    /**
     * The data region's layout.
     */
    public readonly layout: {

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
     * @remarks
     *  Because the overridden `insertRow()` is used in the base constructor, 
     * `collapsed` is accessed before it's defined. To avoid this, `collapsed`
     * is backed by `_collapsed` which is initialized on first access of 
     * `collapsed`. 
     */
    public get collapsed(): Map<string, boolean> {
        if(this._collapsed === undefined) {
            this._collapsed = new Map();
        }
        return this._collapsed;
    }

    /**
     * The table row's (internal) collapsed state.
     */
    // @ts-ignore
    private _collapsed: Map<string, boolean>;


    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: ComplexTablePropertyTemplate);
    
    /**
     * Creates a new {@link ComplexTableProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property' value.
     * @throws { Error }
     *  If `template` defines a non-atomic property.
     */
    constructor(section: PageSection, template: ComplexTablePropertyTemplate, value: TabularPropertyRowValue[]);
    constructor(section: PageSection, template: ComplexTablePropertyTemplate, value?: TabularPropertyRowValue[]) {
        if(value === undefined) {
            super(section, template);  
        } else {
            super(section, template, value);  
        }
        this.layout = {
            summary: template.layout.summary,
            rows: template.layout.rows,
            cols: template.layout.cols
        };
        this.initializePlugins(template);
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
    public override insertRow(row: [string, AtomicProperty[]], index?: number) {
        // Update collapsed state
        this.collapsed.set(row[0], true);
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
            this.collapsed.delete(_);
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
        if(this.collapsed.has(id)) {
            this.collapsed.set(id, collapse);
        }
    }

}
