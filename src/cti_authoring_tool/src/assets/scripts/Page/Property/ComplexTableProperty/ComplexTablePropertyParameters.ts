import { PropertyParameters } from "../PropertyParameters";

export interface ComplexTablePropertyParameters extends PropertyParameters {
    
    /**
     * The data region's layout.
     */
    layout: {

        /**
         * The data region's summary template.
         */
        summary: string;

        /**
         * The number of rows in each data region.
         */
        rows: number;

        /**
         * The number of columns in each data region.
         */
        cols: number;

    }

}
