import { Page } from "../Page";
import { Section } from ".";
import { Property } from "../Property";
import { PageElement } from "../PageElement";

export interface SectionAccessor {
    
    /**
     * The section.
     */
    section: Section;

    /**
     * Gets the section's parent.
     * @returns
     *  The section's parent.
     */
    getParent: () => PageElement | null;

    /**
     * Sets the section's parent.
     * @param p
     *  The section's parent.
     */
    setParent: (p: Page | null) => void;

    /**
     * The section's properties.
     */
    properties: Map<string, Property>;

}
