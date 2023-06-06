import { PageCommand } from "../../PageCommand";
import { DateTimeProperty } from "@/assets/scripts/Page";

export class SetDateTimeProperty extends PageCommand {

    /**
     * The property to modify.
     */
    private _property: DateTimeProperty;

    /**
     * The property's current value.
     */
    private _lastValue: Date | null;

    /**
     * The property's new value.
     */
    private _nextValue: Date | null;
    

    /**
     * Sets a date property's value.
     * @param property
     *  The date property.
     * @param value
     *  The property's new value.
     */
    constructor(property: DateTimeProperty, value: Date | null) {
        super(property.rootInstance);
        this._property = property;
        this._lastValue = property.value;
        this._nextValue = value;
    }
    

    /**
     * Executes the page command.
     * @returns
     *  True if the command should be recorded, false otherwise.
     */
    public execute(): boolean {
        this._property.value = this._nextValue;
        return true;
    }

    /**
     * Undoes the page command.
     */
    public undo() {
        this._property.value = this._lastValue;
    }

}
