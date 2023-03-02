import { PageCommand } from "../PageCommand";
import { TableProperty } from "../../Page/Property/TableProperty";
import { AtomicProperty } from "../../Page/Property";

export class DeleteRowTableProperty extends PageCommand {

    /**
     * The table property to modify.
     */
    private _property: TableProperty;

    /**
     * The row to remove.
     */
    private _row: [string, AtomicProperty[]];
    
    /**
     * The row's index.
     */
    private _index: number;

    
    /**
     * Deletes a row from a table property.
     * @param property
     *  The table property.
     * @param id
     *  The row's id.
     */
    constructor(property: TableProperty, id: string) {
        super(property.getPageInstance());
        if(!property.value.has(id)) {
            throw new Error(`Table row '${ id }' does not exist.`);
        }
        this._property = property;
        this._row = property.getRow(id)!;
        this._index = property.getIndex(id)!;
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.deleteRow(this._index);
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.insertRow(this._row, this._index);
    }

}
