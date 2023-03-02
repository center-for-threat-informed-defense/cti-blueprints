import { Sort } from "../../AppConfiguration";
import { PageCommand } from "../PageCommand";
import { ColumnSnapshot, TableProperty } from "../../Page/Property/TableProperty";

export class ReorderTableProperty extends PageCommand {

    /**
     * The table property to modify.
     */
    private _property: TableProperty;

    /**
     * The previous column snapshot.
     */
    private _prevSnapshot: ColumnSnapshot;

    /**
     * The next column snapshot.
     */
    private _nextSnapshot: ColumnSnapshot;


    /**
     * Reorders a table property.
     * @param property
     *  The table property.
     * @param id
     *  The column's id.
     * @param sort
     *  The column's new sort order.
     */
    constructor(property: TableProperty, id: string, sort: Sort) {
        super(property.getPageInstance());
        if(!property.header.find(o => o.id === id)) {
            throw new Error(`Table column '${ id }' does not exist.`);
        }
        this._property = property;
        this._prevSnapshot = this._property.captureColumnSnapshot(id);
        this._nextSnapshot = this._property.captureColumnSnapshot(id, sort);
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.applyColumnSnapshot(this._nextSnapshot);
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.applyColumnSnapshot(this._prevSnapshot);
    }

}
