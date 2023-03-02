import { AppCommand } from "../AppCommand";
import { Property } from "../../Page/Property/Property";

export class DestroyProperty extends AppCommand {

    /**
     * The property to destroy.
     */
    private _property: Property;


    /**
     * Removes a property from the DOM.
     * @param property
     *  The property to destroy.
     */
    constructor(property: Property) {
        super();
        this._property = property;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.onDestroy();
    }

}
