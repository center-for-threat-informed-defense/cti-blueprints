import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { NumberPropertyTemplate } from "../../../AppConfiguration";

export class NumberProperty extends AtomicProperty {
    
    /**
     * The property's value.
     */
    public value: null | number;


    /**
     * Creates a new {@link NumberProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: NumberPropertyTemplate);

    /**
     * Creates a new {@link NumberProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    constructor(section: PageSection, template: NumberPropertyTemplate, value: number);
    constructor(section: PageSection, template: NumberPropertyTemplate, value?: number) {
        super(section, template);
        if(value !== undefined) {
            this.value = value;
        } else if(template.default !== undefined) {
            this.value = template.default;
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
