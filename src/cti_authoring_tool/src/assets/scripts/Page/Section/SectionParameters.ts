export type SectionParameters = {

    /**
     * The section's id.
     */
    id: string;

    /**
     * The section's name.
     */
    name?: string | null;

    /**
     * The section's export path.
     */
    path?: string | null;

    /**
     * The section's layout.
     */
    layout: {
        
        /**
         * The number of rows in the section.
         */
        rows: number,

        /**
         * The number of columns in the section.
         */
        cols: number

    }

}
