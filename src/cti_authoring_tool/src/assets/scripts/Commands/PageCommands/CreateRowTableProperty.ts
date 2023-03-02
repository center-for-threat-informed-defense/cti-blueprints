import { PageCommand } from "../PageCommand";
import { TableProperty } from "../../Page/Property/TableProperty";
import { AtomicProperty } from "../../Page/Property";

export class CreateRowTableProperty extends PageCommand {

    /**
     * The table property to modify.
     */
    private _property: TableProperty;

    /**
     * The row to insert.
     */
    private _row: [string, AtomicProperty[]];
    

    /**
     * Adds a new row to a table property.
     * @param property
     *  The table property.
     */
    constructor(property: TableProperty) {
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
