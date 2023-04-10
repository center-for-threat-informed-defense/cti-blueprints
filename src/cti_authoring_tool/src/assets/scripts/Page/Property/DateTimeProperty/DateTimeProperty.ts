import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { IDateTimeProperty } from "./IDateTimeProperty";
import { DateTimePropertyTemplate } from "@/assets/scripts/AppConfiguration";

export class DateTimeProperty extends AtomicProperty implements IDateTimeProperty {

    /**
     * The property's value.
     */
    public value: Date | null;


    /**
     * Creates a new {@link DateTimeProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: DateTimePropertyTemplate); 

    /**
     * Creates a new {@link DateTimeProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: DateTimePropertyTemplate, value: string);
    constructor(section: PageSection, template: DateTimePropertyTemplate, value?: string) {
        super(section, template);
        this.value = null;
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
    ///  1. IDateTimeProperty Methods  ////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Sets the property's value directly.
     * @param value
     *  The property's new value.
     */
    public setValue(value: Date | string | null): void {
        if(value === null) {
            this.value = null;
        } else if(typeof value === "string") {
            this.value = new Date(value);
        } else {
            this.value = value;
        }
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
        return this.value !== null ? `${ this.value }` : undefined;
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
    public onUpdate(newValue: Date, oldValue: Date) {
        // TODO: Link update event
        this.emit("update", newValue, oldValue);
        this._section.onPropertyUpdate(this, newValue, oldValue);
    }

}
