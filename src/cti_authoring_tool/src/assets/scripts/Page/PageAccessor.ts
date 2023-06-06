import { Page } from "./Page";
import { Section } from "./Section";

export interface PageAccessor {

    /**
     * The page.
     */
    page: Page;

    /**
     * The page's sections.
     */
    sections: Map<string, Section>

}
