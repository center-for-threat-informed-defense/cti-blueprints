import { PageCommand } from "../../PageCommand";
import { TabularProperty } from "@/assets/scripts/Page";

export class MoveTabularPropertyRow extends PageCommand {

    /**
     * The tabular property to modify.
     */
    private _property: TabularProperty;

    /**
     * The row's current index.
     */
    private _src: number;

    /**
     * The row's new index.
     */
    private _dst: number;


    /**
     * Moves a row to another location within a tabular property.
     * @param property
     *  The tabular property.
     * @param id
     *  The row's id.
     * @param dst
     *  The row's new index.
     */
    constructor(property: TabularProperty, id: string, dst: number) {
        super(property.rootInstance);
        if(property.getRowIndex(id) === -1) {
            throw new Error(`Table row '${ id }' does not exist in '${ property.id }'.`);
        }
        this._property = property;
        this._src = this._property.getRowIndex(id);
        this._dst = dst;
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.moveRow(this._src, this._dst);
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.moveRow(this._dst, this._src);
    }

}
