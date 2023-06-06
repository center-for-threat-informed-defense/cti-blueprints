import { Page } from "../Page";
import { PageElement } from "../PageElement";
import { SectionLayout } from "./SectionLayout";
import { SectionAssembler } from "./SectionAssembler";
import { SectionParameters } from "./SectionParameters";
import { Plugin, PluginManager } from "../Plugins";
import { Property, PropertyAssembler } from "../Property";

export class Section extends PageElement {

    /**
     * The section's id.
     */
    public readonly id: string;

    /**
     * The section's name.
     */
    public readonly name: string | null;

    /**
     * The section's export path.
     */
    public readonly path: string;

    /**
     * The section's layout.
     */
    public readonly layout: SectionLayout;

    /**
     * The section's properties.
     */
    public readonly properties: ReadonlyMap<string, Property>;

    /**
     * The section's plugins.
     */
    private _plugins: PluginManager<Section> | null;
    

    /**
     * Creates a new {@link Section}.
     * @param params
     *  The section's parameters.
     */
    constructor(params: SectionParameters);

    /**
     * Creates a new {@link Section}.
     * @param params
     *  The section's parameters.
     * @param assembler
     *  The section's assembler.
     */
    constructor(params: SectionParameters, assembler?: SectionAssembler);
    constructor(params: SectionParameters, assembler?: SectionAssembler) {
        super();
        // Configure state
        this.id = params.id;
        this.name = params.name ?? null;
        this.path = params.path ?? params.id;
        this.layout = { 
            rows: params.layout.rows,
            cols: params.layout.cols
        }
        this.properties = new Map();
        this._parent = null;
        this._plugins = null;
        // Configure assembler
        if(assembler) {
            this.__prepareAssembler(assembler);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Section Cloning  //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    
    
    /**
     * Clones the section.
     * @returns
     *  The cloned section.
     */
    public clone(): Section

    /**
     * Clones the section.
     * @param assembler
     *  The cloned section's assembler.
     * @returns
     *  The cloned section.
     */
    public clone(assembler?: SectionAssembler): Section;
    public clone(assembler?: SectionAssembler): Section {
        assembler ??= new SectionAssembler();
        // Create section
        let section = new Section({
            id       : this.id,
            name     : this.name,
            path     : this.path,
            layout: {
                rows : this.layout.rows,
                cols : this.layout.cols
            }
        }, assembler);
        // Clone properties
        for(let property of this.properties.values()) {
            let propertyAssembler = new PropertyAssembler();
            property.clone(propertyAssembler);
            assembler.attachProperty(propertyAssembler);
        }
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            section.tryInstallPlugin(plugin)
        });
        // Return
        return section;
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
    public tryInstallPlugin(plugin: Plugin<Section>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<Section>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<Section>[]): boolean {
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
     * Prepares an assembler for the section.
     * @returns
     *  The section's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(): SectionAssembler

    /**
     * Prepares an assembler for the section.
     * @param assembler
     *  The assembler to use.
     * @returns
     *  The section's assembler.
     * @remarks
     *  Page API use only. Do not use.
     * @internal
     */
    public __prepareAssembler(assembler?: SectionAssembler): SectionAssembler;
    public __prepareAssembler(assembler: SectionAssembler = new SectionAssembler()): SectionAssembler {
        assembler.__injectAccessor({
            section: this,
            getParent: () => this._parent,
            setParent: (p: Page | null) => this._parent = p,
            properties: this.properties as Map<string, Property>
        });
        return assembler;
    }

}
