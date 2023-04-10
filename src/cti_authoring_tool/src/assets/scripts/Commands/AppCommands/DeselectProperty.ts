import { AppCommand } from "../AppCommand";
import { AtomicProperty } from "../../Page/Property/AtomicProperty/AtomicProperty";

export class DeselectProperty extends AppCommand {

    /**
     * The property to deselect.
     */
    private _property: AtomicProperty;


    /**
     * Deselects a property from the DOM.
     * @param property
     *  The property to deselect.
     */
    constructor(property: AtomicProperty) {
        super();
        this._property = property;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.onDeselect();
    }

}
