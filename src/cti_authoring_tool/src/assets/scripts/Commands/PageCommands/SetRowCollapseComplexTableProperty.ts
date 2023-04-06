import { PageCommand } from "../PageCommand";
import { ComplexTableProperty } from "../../Page/Property";

export class SetRowCollapseComplexTableProperty extends PageCommand {

    /**
     * The table property to modify.
     */
    private _property: ComplexTableProperty;

    /**
     * The row's id.
     */
    private _id: string;
    
    /**
     * The last collapse state.
     */
    private _lastValue: boolean;

    /**
     * The next collapse state.
     */
    private _nextValue: boolean;


    /**
     * Collapses a complex table property's row.
     * @param property
     *  The table property.
     * @param row
     *  The row's id.
     * @param collapse
     *  True to collapse, false to uncollapse.
     */
    constructor(property: ComplexTableProperty, id: string, collapse: boolean) {
        super(property.getPageInstance());
        if(!property.value.has(id)) {
            throw new Error(`Row '${ id }' does not exist in '${ property.id }'.`);
        }
        this._property = property;
        this._id = id;
        this._lastValue = property.collapsed.get(id)!;
        this._nextValue = collapse;
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.setRowCollapse(this._id, this._nextValue);
        return false;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.setRowCollapse(this._id, this._lastValue);   
    }

}
