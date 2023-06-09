import { PageCommand } from "../../PageCommand";
import { AtomicProperty } from "@/assets/scripts/Page/Property";

export class SelectAtomicProperty extends PageCommand {

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
        super(property.rootInstance);
        this._property = property;
    }

    
    /**
     * Executes a page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.emitUpward("select", this._property);
        return false;
    }

    /**
     * Undoes the page command.
     */
    public undo(): void {}

}
