import { Crypto } from "../Utilities/Crypto";
import { PageSection } from "./PageSection";
import { PageTemplate } from "../AppConfiguration";

export class Page {

    /**
     * The page's instance id.
     */
    public instance: string;

    /**
     * The page template's id.
     */
    public id: string;

    /**
     * The page template's name.
     */
    public template: string;

    /**
     * The page's sections.
     */
    public sections: Map<string, PageSection>;


    /**
     * The page's name.
     */
    public get name(): string {
        let name = "";
        for(let section of this.sections.values()) {
            if(!section.isPrimary)
                continue;
            name = [...section.properties.values()]
                .filter(o => o.isPrimary && o.toString())
                .map(o => o.toString())
                .join(" - ");
            break;
        }
        return name || `Untitled ${ this.template }`;
    };


    /**
     * Creates a new {@link Page}.
     * @param template
     *  The page's template.
     */
    constructor(template: PageTemplate) {
        // Init state
        this.instance = Crypto.randomUUID();
        this.id = template.id;
        this.template = template.name;
        // this.name = template.name;
        this.sections = new Map();
        // Init sections
        for(let s of template.sections) {
            let section = new PageSection(this, s);
            if(!this.sections.has(section.id)) {
                this.sections.set(section.id, section);
            } else {
                throw new Error(`Section '${ 
                    section.id 
                }' is defined twice in page '${ 
                    this.id
                }'.`);
            }
        }
    }

}
