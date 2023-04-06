import { ITabularProperty } from "../TabularProperty/ITabularProperty";

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


    /**
     * Collapses a row.
     * @param id
     *  The row's id.
     * @param collapse
     *  True to collapse, false to uncollapse. 
     */
    setRowCollapse(id: string, collapse: boolean): void;

}
