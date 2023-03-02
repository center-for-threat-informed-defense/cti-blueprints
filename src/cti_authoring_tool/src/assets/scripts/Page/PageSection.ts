import { Page } from "./Page";
import { Property } from "./Property";
import { PageSectionTemplate } from "../AppConfiguration";

export class PageSection {

    /**
     * The page the section belongs to.
     */
    private _page: Page;

    /**
     * The section's id.
     */
    public id: string;

    /**
     * The section's name.
     */
    public name: string;

    /**
     * The number of rows in the section.
     */
    public rows: number;

    /**
     * The number of columns in the section.
     */
    public cols: number;

    /**
     * The section's properties.
     */
    public properties: Map<string, Property>;

    /**
     * The section's primary status.
     */
    public isPrimary: boolean;


    /**
     * Creates a new {@link PageSection}.
     * @param page
     *  The page the section belongs to.
     * @param template
     *  The sections's template.
     */
    constructor(page: Page, template: PageSectionTemplate) {
        // Init state
        this._page = page;
        this.id = template.id;
        this.name = template.id;
        this.rows = template.rows;
        this.cols = template.cols;
        this.properties = new Map();
        this.isPrimary = template.is_primary ?? false;
        // Init properties
        for(let t of template.properties) {
            let prop = Property.create(this, t);
            this.properties.set(prop.id, prop);
        }
    }

    /**
     * Returns the instance id of the page the section belongs to.
     * @returns
     *  The instance id of the page the section belongs to.
     */
    public getPageInstance(): string {
        return this._page.instance;
    }

}
