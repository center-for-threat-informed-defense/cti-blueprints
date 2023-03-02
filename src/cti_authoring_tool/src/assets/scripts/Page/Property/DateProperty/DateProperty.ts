import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { DatePropertyTemplate } from "@/assets/scripts/AppConfiguration";

export class DateProperty extends AtomicProperty {

    /**
     * The property's value.
     */
    public value: null | Date;


    /**
     * Creates a new {@link DateProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: DatePropertyTemplate); 

    /**
     * Creates a new {@link DateProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: DatePropertyTemplate, value: string);
    constructor(section: PageSection, template: DatePropertyTemplate, value?: string) {
        super(section, template);
        if(value !== undefined) {
            this.value = new Date(value);
        } else if(template.default !== undefined) {
            if(template.default === null) {
                this.value = null;
            } else {
                this.value = new Date(template.default); 
            }
        } else {
            this.value = null;
        }
    }


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public toString(): string | undefined {
        return this.value !== null ? `${ this.value }` : undefined;
    }

}