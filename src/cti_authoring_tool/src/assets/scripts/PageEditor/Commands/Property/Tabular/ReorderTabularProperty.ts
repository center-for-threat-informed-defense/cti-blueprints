import { PageCommand } from "../../PageCommand";
import { ColumnSnapshot, Sort, TabularProperty } from "@/assets/scripts/Page";

export class ReorderTabularProperty extends PageCommand {

    /**
     * The tabular property to modify.
     */
    private _property: TabularProperty;

    /**
     * The previous column snapshot.
     */
    private _prevSnapshot: ColumnSnapshot;

    /**
     * The next column snapshot.
     */
    private _nextSnapshot: ColumnSnapshot;


    /**
     * Reorders a tabular property.
     * @param property
     *  The tabular property.
     * @param id
     *  The id of the column to order on.
     * @param sort
     *  The column's new sort order.
     */
    constructor(property: TabularProperty, id: string, sort: Sort) {
        super(property.rootInstance);
        if(!property.columnState.find(o => o.id === id)) {
            throw new Error(`Table column '${ id }' does not exist in '${ property.id }'.`);
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
