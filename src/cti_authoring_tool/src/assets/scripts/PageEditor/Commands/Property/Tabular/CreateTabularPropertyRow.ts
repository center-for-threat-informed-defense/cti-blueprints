import { PageCommand } from "../../PageCommand";
import { AtomicProperty, TabularProperty } from "@/assets/scripts/Page";

export class CreateTabularPropertyRow extends PageCommand {

    /**
     * The tabular property to modify.
     */
    private _property: TabularProperty;

    /**
     * The row to insert.
     */
    private _row: [string, AtomicProperty[]];

    /**
     * The row's index.
     */
    private _index: number | undefined;

    
    /**
     * Adds a new row to a tabular property.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty);

    /**
     * Adds a new row to a tabular property.
     * @param property
     *  The tabular property.
     * @param values
     *  The row's values.
     */
    constructor(property: TabularProperty, values: { [key: string]: any });

    /**
     * Adds a new row to a tabular property.
     * @param property
     *  The tabular property.
     * @param values
     *  The row's values.
     * @param index
     *  The row's index.
     */
    constructor(property: TabularProperty, values?: { [key: string]: any }, index?: number);
    constructor(property: TabularProperty, values?: { [key: string]: any }, index?: number) {
        super(property.rootInstance);
        this._property = property;
        this._row = property.createRow(values);
        this._index = index;
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.insertRow(this._row, this._index);
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.deleteRow(this._row[0]);   
    }

}
