import { PageSection } from "../../PageSection";
import { AtomicProperty } from "..";
import { EnumPropertyTemplate } from "@/assets/scripts/AppConfiguration";

export class EnumProperty extends AtomicProperty {
 
    /**
     * The property's internal value.
     */
    public value: null | any;


    /**
     * Creates a new {@link EnumProperty}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: EnumPropertyTemplate) {
        super(section, template);
        this.value = null;
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