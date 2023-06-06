import { Page } from "./Page"
import { PageAccessor } from "./PageAccessor";
import { SectionAssembler } from "./Section/SectionAssembler";

export class PageAssembler {

    /**
     * The page's accessor.
     */
    private _accessor: PageAccessor | null;

    /**
     * The assembler's sections.
     */
    private _sectionAssemblers: Map<string, SectionAssembler>;

    
    /**
     * The assembler's page.
     */
    public get page(): Page {
        return this.accessor.page;
    }
    
    /**
     * The assembler's sections.
     */
    public get sections(): ReadonlyMap<string, SectionAssembler> {
        return this._sectionAssemblers;
    }

    /**
     * The page's accessor.
     */
    private get accessor(): PageAccessor {
        if(this._accessor === null) {
            throw new Error("Assembler is not configured with a page.");
        }
        return this._accessor;
    }


    /**
     * Creates a new {@link PageAssembler}.
     */
    constructor() {
        this._accessor = null;
        this._sectionAssemblers = new Map();
    }


    /**
     * Injects a page's private resources into the assembler.
     * @param accessor
     *  The page's accessor.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __injectAccessor(accessor: PageAccessor) {
        this._accessor = accessor;
        this._sectionAssemblers = new Map();
    }

    /**
     * Adds a section to the page.
     * @param asm
     *  The section's assembler.
     */
    public attachSection(asm: SectionAssembler) {
        // Validate
        if(this.includesSection(asm)) {
            return;
        }
        // Detach existing child, if needed
        let id = asm.section.id;
        if(this.includesSection(id)) {
            this.detachSection(id);
        }
        // Attach section
        this.accessor.sections.set(id, asm.section);
        this._sectionAssemblers.set(id, asm);
        // Attach parent
        asm.attachToPage(this);
    }

    /**
     * Removes a section from the page.
     * @param
     *  The section's id.
     */
    public detachSection(id: string): void;

    /**
     * Removes a section from the page.
     * @param asm
     *  The section's assembler.
     */
    public detachSection(asm: SectionAssembler): void;
    public detachSection(obj: string | SectionAssembler): void {
        // Validate section
        if(!this.includesSection(obj)) {
            return;
        }
        if(typeof obj === "string") {
            obj = this.sections.get(obj)!;
        }
        // Detach section
        let id = obj.section.id;
        this.accessor.sections.delete(id);
        this._sectionAssemblers.delete(id);
        // Detach parent
        obj.detachFromPage();
    }

    /**
     * Tests if the page includes a section.
     * @param id
     *  The section's id.
     * @returns
     *  True if the page includes the section, false otherwise.
     */
    public includesSection(id: string): boolean;

    /**
     * Tests if the page includes a section.
     * @param asm
     *  The section's assembler.
     * @returns
     *  True if the page includes the section, false otherwise.
     */
    public includesSection(asm: SectionAssembler): boolean;
    public includesSection(obj: string | SectionAssembler): boolean;
    public includesSection(obj: string | SectionAssembler): boolean {
        let sections = this.accessor.sections;
        // If string
        if(typeof obj === "string") {
            return sections.has(obj);
        }
        // If section
        let id = obj.section.id;
        if(!sections.has(id)) {
            return false;
        }
        let sec = sections.get(id)!;
        if(sec.instance !== obj.section.instance) {
            return false;
        }
        return true;
    }

}
