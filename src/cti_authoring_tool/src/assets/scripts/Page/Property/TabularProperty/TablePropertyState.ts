import { Sort } from "./Sort";

export interface TablePropertyState {
    
    /**
     * The property's id.
     */
    id: string;

    /**
     * The property's name.
     */
    name: string;

    /**
     * The property's sort state.
     */
    sort: Sort;

    /**
     * The property's column position.
     */
    col: number | [number, number];

    /**
     * The property's row position.
     */
    row: number | [number, number];

}
