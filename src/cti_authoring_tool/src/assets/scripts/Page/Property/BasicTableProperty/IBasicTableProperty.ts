import { ITabularProperty } from "../TabularProperty/ITabularProperty";

export interface IBasicTableProperty extends ITabularProperty {

    /**
     * The table's layout.
     */
    readonly layout: {

        /**
         * The table's number of columns.
         */
        readonly cols: number;

    }

}
