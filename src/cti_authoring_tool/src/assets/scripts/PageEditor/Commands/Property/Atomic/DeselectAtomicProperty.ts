import { AtomicProperty } from "@/assets/scripts/Page/Property";
import { PageCommand } from "../../PageCommand";

export class DeselectAtomicProperty extends PageCommand {

    /**
     * The property to deselect.
     */
    private _property: AtomicProperty;


    /**
     * Deselects an atomic property from the DOM.
     * @param property
     *  The property to deselect.
     */
    constructor(property: AtomicProperty) {
        super(property.rootInstance);
        this._property = property;
    }
    

    /**
     * Executes a page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.emitUpward("deselect", this._property);
        return false;
    }

    /**
     * Undoes the page command.
     */
    public undo(): void {}

}
