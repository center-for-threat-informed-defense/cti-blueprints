import { PageElement } from "./PageElement";
import { PageAssembler } from "./PageAssembler";
import { PageParameters } from "./PageParameters";
import { Plugin, PluginManager } from "./Plugins";
import { Section, SectionAssembler } from "./Section";

export class Page extends PageElement {

    /**
     * The page's id.
     */
    public readonly id: string;

    /**
     * The page's export path.
     */
    public readonly path: string;

    /**
     * The page's sections.
     */
    public readonly sections: ReadonlyMap<string, Section>;

    /**
     * The section's plugins.
     */
    private _plugins: PluginManager<Page> | null;


    /**
     * Creates a new {@link Page}.
     * @param params
     *  The page's parameters.
     */
    constructor(params: PageParameters);

    /**
     * Creates a new {@link Page}.
     * @param params
     *  The page's parameters.
     * @param assembler
     *  The page's assembler.
     */
    constructor(params: PageParameters, assembler?: PageAssembler);
    constructor(params: PageParameters, assembler?: PageAssembler) {
        super();
        let sections = new Map();
        // Configure state
        this.id = params.id;
        this.path = params.path ?? params.id;
        this.sections = sections;
        this._plugins = null;
        // Configure page assembler
        if(assembler) {
            this.__prepareAssembler(assembler);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Section Cloning  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the page.
     * @returns
     *  The cloned page.
     */
    public clone(): Page

    /**
     * Clones the page.
     * @param assembler
     *  The cloned page's assembler.
     * @returns
     *  The cloned page.
     */
    public clone(assembler?: PageAssembler): Page;
    public clone(assembler?: PageAssembler): Page {
        assembler ??= new PageAssembler();
        // Create page
        let page = new Page({
            id   : this.id,
            path : this.path
        }, assembler);
        // Clone sections
        for(let section of this.sections.values()) {
            let sectionAssembler = new SectionAssembler();
            section.clone(sectionAssembler);
            assembler.attachSection(sectionAssembler);
        }
        // Return
        return page;
    }

    
    ///////////////////////////////////////////////////////////////////////////
    ///  2. Plugin Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Attempts to install a plugin into the property.
     * @param plugin
     *  The plugin to install.
     * @returns
     *  True if the plugin was successfully installed, false otherwise.
     */
    public tryInstallPlugin(plugin: Plugin<Page>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<Page>(this, this.root);
        }
        result = this._plugins.tryInstallPlugin(plugin);
        // Deallocate manager if no plugins were installed
        if(this._plugins.length === 0) {
            this._plugins = null;
        }
        return result;
    }

    /**
     * Attempts to install a list of plugins into the property.
     * @param plugin
     *  The plugins to install.
     * @returns
     *  True if all plugins were successfully installed, false otherwise.
     */
    public tryInstallPlugins(plugins: Plugin<Page>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  3. Assembler Preparation  ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Prepares an assembler for the page.
     * @returns
     *  The page's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(): PageAssembler

    /**
     * Prepares an assembler for the page.
     * @param assembler
     *  The assembler to use.
     * @returns
     *  The page's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(assembler?: PageAssembler): PageAssembler;
    public __prepareAssembler(assembler: PageAssembler = new PageAssembler()): PageAssembler {
        assembler.__injectAccessor({
            page: this,
            sections: this.sections as Map<string, Section>
        });
        return assembler;
    }

}
