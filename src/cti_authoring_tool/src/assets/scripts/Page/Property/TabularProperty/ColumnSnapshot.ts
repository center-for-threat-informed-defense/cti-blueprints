import { Sort } from "./Sort";

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
