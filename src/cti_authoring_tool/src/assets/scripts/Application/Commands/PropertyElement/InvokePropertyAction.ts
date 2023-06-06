
import { Property } from "@/assets/scripts/Page";
import { AppCommand } from "../AppCommand";

export class InvokePropertyAction extends AppCommand {

    /**
     * The action's id.
     */
    private _id: string;

    /**
     * The property.
     */
    private _property: Property;


    /**
     * Invokes a property's action.
     * @param property
     *  The property.
     * @param id
     *  The action's id.
     */
    constructor(property: Property, id: string) {
        super();
        this._property = property;
        this._id = id;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.invokeAction(this._id);
    }

}
