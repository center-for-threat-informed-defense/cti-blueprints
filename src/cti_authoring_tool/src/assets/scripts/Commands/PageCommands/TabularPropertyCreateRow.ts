import { PageCommand } from "../PageCommand";
import { AtomicProperty } from "../../Page/Property";
import { TabularProperty } from "../../Page/Property/TabularProperty/TabularProperty";

export class TabularPropertyCreateRow extends PageCommand {

    /**
     * The tabular property to modify.
     */
    private _property: TabularProperty;

    /**
     * The row to insert.
     */
    private _row: [string, AtomicProperty[]];
    

    /**
     * Adds a new row to a tabular property.
     * @param property
     *  The tabular property.
     */
    constructor(property: TabularProperty) {
        super(property.getPageInstance());
        this._property = property;
        this._row = property.createRow();
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.insertRow(this._row);
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.deleteRow(this._row[0]);   
    }

}
