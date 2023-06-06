import { PropertyParameters } from "../PropertyParameters";

export interface BasicTablePropertyParameters extends PropertyParameters {
   
    /**
     * The table's layout.
     */
    layout: {

        /**
         * The table's number of columns.
         */
        cols: number;

    }

}
