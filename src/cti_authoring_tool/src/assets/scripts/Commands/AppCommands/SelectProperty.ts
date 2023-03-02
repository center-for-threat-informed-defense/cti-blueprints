import { AppCommand } from "../AppCommand";
import { AtomicProperty } from "../../Page/Property/AtomicProperty";

export class SelectProperty extends AppCommand {

    /**
     * The property to select.
     */
    private _property: AtomicProperty;


    /**
     * Selects a property from the DOM.
     * @param property
     *  The property to select.
     */
    constructor(property: AtomicProperty) {
        super();
        this._property = property;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.onSelect();
    }

}
