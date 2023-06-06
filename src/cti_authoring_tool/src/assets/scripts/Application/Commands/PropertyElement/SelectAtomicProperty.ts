import { AppCommand } from "../AppCommand";
import { AtomicProperty } from "@/assets/scripts/Page";

export class SelectAtomicProperty extends AppCommand {

    /**
     * The property to select.
     */
    private _property: AtomicProperty;


    /**
     * Selects an atomic property from the DOM.
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
        this._property.emit("select");
    }

}
