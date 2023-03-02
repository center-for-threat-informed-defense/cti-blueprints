import { AtomicProperty } from "..";
import { PageSection } from "../../PageSection";
import { StringPropertyTemplate } from "../../../AppConfiguration";

export class StringProperty extends AtomicProperty {

    /**
     * The property's value.
     */
    public value: null | string;

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
        this.suggestions = [];
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
        return this.value ?? undefined;
    }

}
