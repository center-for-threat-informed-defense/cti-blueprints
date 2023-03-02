import { PageCommand } from "../PageCommand";
import { TableProperty } from "../../Page/Property/TableProperty";

export class MoveRowTableProperty extends PageCommand {

    /**
     * The table property to modify.
     */
    private _property: TableProperty;

    /**
     * The row's current index.
     */
    private _src: number;

    /**
     * The row's new index.
     */
    private _dst: number;


    /**
     * Moves a row to another location within a table property.
     * @param property
     *  The table property.
     * @param id
     *  The row's id.
     * @param dst
     *  The row's new index.
     */
    constructor(property: TableProperty, id: string, dst: number) {
        super(property.getPageInstance());
        if(!property.value.has(id)) {
            throw new Error(`Table row '${ id }' does not exist.`);
        }
        this._property = property;
        this._src = this._property.getIndex(id);
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
