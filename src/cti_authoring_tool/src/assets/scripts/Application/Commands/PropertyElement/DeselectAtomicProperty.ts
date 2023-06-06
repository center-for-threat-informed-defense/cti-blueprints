import { AppCommand } from "../AppCommand";
import { AtomicProperty } from "@/assets/scripts/Page";

export class DeselectAtomicProperty extends AppCommand {

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
        super();
        this._property = property;
    }
    

    /**
     * Executes the command.
     */
    public execute(): void {
        this._property.emit("select");
    }

}
