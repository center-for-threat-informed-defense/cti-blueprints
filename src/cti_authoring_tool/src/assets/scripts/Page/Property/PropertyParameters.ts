export type PropertyParameters = {

    /**
     * The property's id.
     */
    id: string;

    /**
     * The property's name.
     */
    name: string;

    /**
     * The property's export path.
     */
    path?: string | null;

    /**
     * The property's help link.
     */
    link?: string | null;

    /**
     * The property's row.
     */
    row: number | [number, number];

    /**
     * The property's column.
     */
    col: number | [number, number];

}
