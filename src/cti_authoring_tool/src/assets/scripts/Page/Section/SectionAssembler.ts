import { Section } from ".";
import { PageAssembler } from "../PageAssembler";
import { SectionAccessor } from "./SectionAccessor";
import { PropertyAssembler } from "../Property/PropertyAssembler";

export class SectionAssembler {

    /**
     * The section's accessor.
     */
    private _accessor: SectionAccessor | null;

    /**
     * The assembler's parent.
     */
    private _parentAssembler: PageAssembler | null;

    /**
     * The assembler's properties.
     */
    private _propertyAssemblers: Map<string, PropertyAssembler>;


    /**
     * The assembler's section.
     */
    public get section(): Section {
        return this.accessor.section;
    }

    /**
     * The assembler's parent.
     */
    public get parent(): PageAssembler | null {
        return this._parentAssembler;
    }

    /**
     * The assembler's properties.
     */
    public get properties(): ReadonlyMap<string, PropertyAssembler> {
        return this._propertyAssemblers;
    }

    /**
     * The section's accessor.
     */
    private get accessor(): SectionAccessor {
        if(this._accessor === null) {
            throw new Error("Assembler is not configured with a section.");
        }
        return this._accessor;
    }


    /**
     * Creates a new {@link SectionAssembler}.
     */
    constructor() {
        this._accessor = null;
        this._parentAssembler = null;
        this._propertyAssemblers = new Map();
    }


    /**
     * Injects a section's private resources into the assembler.
     * @param accessor
     *  The section's accessor.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __injectAccessor(accessor: SectionAccessor) {
        this._accessor = accessor;
        this._parentAssembler = null;
        this._propertyAssemblers = new Map();
    }

    /**
     * Adds the section to a page.
     * @param asm
     *  The page's assembler.
     */
    public attachToPage(asm: PageAssembler) {
        // Validate
        if(this.belongsToPage(asm)) {
            return;
        }
        // Detach existing parent, if needed
        if(this.belongsToPage()) {
            this.detachFromPage();
        }
        // Attach parent
        this.accessor.setParent(asm.page);
        this._parentAssembler = asm;
        // Attach section
        asm.attachSection(this);
    }

    /**
     * Removes the section from its current page.
     */
    public detachFromPage() {
        // Validate
        if(!this.belongsToPage()) {
            return;
        }
        let parent = this._parentAssembler!;
        // Detach parent
        this.accessor.setParent(null);
        this._parentAssembler = null;
        // Detach section
        parent.detachSection(this);
    }

    /**
     * Tests if the section belongs to a page.
     * @returns
     *  True if the section belongs to a page, false otherwise.
     */
    public belongsToPage(): boolean;

    /**
     * Tests if the section belongs to the given page.
     * @param asm
     *  The page's assembler.
     * @returns
     *  True if the section belongs to the given page, false otherwise.
     */
    public belongsToPage(asm: PageAssembler): boolean;
    public belongsToPage(asm?: PageAssembler): boolean {
        let parent = this.accessor.getParent();
        if(parent === null) {
            return false;
        } else if(asm === undefined) {
            return true;
        }
        return parent.instance === asm.page.instance;
    }

    /**
     * Adds a property to the section.
     * @param asm
     *  The property's assembler.
     */
    public attachProperty(asm: PropertyAssembler) {
        // Validate
        if(this.includesProperty(asm)) {
            return;
        }
        // Detach existing child, if needed
        let id = asm.property.id;
        if(this.includesProperty(id)) {
            this.detachProperty(id);
        }
        // Attach property
        this.accessor.properties.set(id, asm.property);
        this._propertyAssemblers.set(id, asm);
        // Attach parent
        asm.attachToSection(this);
    }
    
    /**
     * Removes a property from the section.
     * @param id
     *  The property's id.
     */
    public detachProperty(id: string): void;
    
    /**
     * Removes a property from the section.
     * @param asm
     *  The property's assembler.
     */
    public detachProperty(asm: PropertyAssembler): void;
    public detachProperty(obj: string | PropertyAssembler): void {
        if(!this.includesProperty(obj)) {
            return;
        }
        if(typeof obj === "string") {
            obj = this.properties.get(obj)!;
        }
        // Detach property
        let id = obj.property.id;
        this.accessor.properties.delete(id);
        this._propertyAssemblers.delete(id);
        // Detach parent
        obj.detachFromParent();
    }

    /**
     * Tests if the section includes a property.
     * @param id
     *  The property's id.
     * @returns
     *  True if the section includes the property, false otherwise.
     */
    public includesProperty(id: string): boolean;

    /**
     * Tests if the section includes a property.
     * @param asm
     *  The property's assembler.
     * @returns
     *  True if the section includes the property, false otherwise.
     */
    public includesProperty(asm: PropertyAssembler): boolean;
    public includesProperty(obj: string | PropertyAssembler): boolean;
    public includesProperty(obj: string | PropertyAssembler): boolean {
        let properties = this.accessor.properties;
        // If string
        if(typeof obj === "string") {
            return properties.has(obj);
        }
        // If property
        let id = obj.property.id;
        if(!properties.has(id)) {
            return false;
        }
        let prop = properties.get(id)!;
        if(prop.instance !== obj.property.instance) {
            return false;
        }
        return true;
    }

}
