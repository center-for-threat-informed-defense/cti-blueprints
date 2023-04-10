import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { IStringProperty } from "./IStringProperty";
import { StringPropertyTemplate } from "../../../AppConfiguration";

export class StringProperty extends AtomicProperty implements IStringProperty {

    /**
     * The property's value.
     */
    public value: string | null;

    /**
     * The property's string suggestions.
     */
    public suggestions: string[];


    /**
     * Creates a new {@link StringProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: StringPropertyTemplate);

    /**
     * Creates a new {@link StringProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: StringPropertyTemplate, value: string);
    constructor(section: PageSection, template: StringPropertyTemplate, value?: string) {
        super(section, template);
        this.value = null;
        this.suggestions = template.suggestions ?? [];
        if(value !== undefined) {
            this.setValue(value);
        } else if(template.default !== undefined) {
            this.setValue(template.default);
        } else {
            this.setValue(null);
        }
        this.initializePlugins(template);
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. IStringProperty Methods  //////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Sets the property's value directly.
     * @param value
     *  The property's new value.
     */
    public setValue(value: string | null): void {
        this.value = value;
    }

    /**
     * Creates a new command.
     */
    public newCommand(): void {
        // TODO: Implement command construct
        throw new Error("Method not implemented.");
    }

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string | undefined {
        return this.value ?? undefined;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. Event Methods  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Property update behavior.
     * @param newValue
     *  The property's new value.
     * @param oldValue
     *  The property's old value.
     */
    public onUpdate(newValue: string, oldValue: string) {
        // TODO: Link update event
        this.emit("update", newValue, oldValue);
        this._section.onPropertyUpdate(this, newValue, oldValue);
    }

}
