import { Section } from "../Section";
import { Property } from ".";
import { PageElement } from "../PageElement";

export interface PropertyAccessor {
    
    /**
     * The property.
     */
    property: Property;

    /**
     * Gets the property's parent.
     * @returns
     *  The property's parent.
     */
    getParent: () => PageElement | null;

    /**
     * Sets the property's parent.
     * @param p
     *  The property's parent.
     */
    setParent: (p: Section | Property | null) => void;

}
