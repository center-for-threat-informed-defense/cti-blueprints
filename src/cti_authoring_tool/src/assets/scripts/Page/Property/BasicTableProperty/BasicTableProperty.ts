import { PlugableElement } from "../../PlugableElement";
import { Plugin, PluginManager } from "../../Plugins";
import { BasicTablePropertyLayout } from "./BasicTablePropertyLayout";
import { BasicTablePropertyParameters, TabularProperty, TabularPropertyAssembler } from "..";

export class BasicTableProperty extends TabularProperty implements PlugableElement<BasicTableProperty> {

    /**
     * The table's layout.
     */
    public readonly layout: BasicTablePropertyLayout;

    /**
     * The property's plugin manager.
     */
    private _plugins: PluginManager<BasicTableProperty> | null;
    

    /**
     * Creates a new {@link BasicTableProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: BasicTablePropertyParameters);
    
    /**
     * Creates a new {@link BasicTableProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: BasicTablePropertyParameters, assembler?: TabularPropertyAssembler);
    constructor(params: BasicTablePropertyParameters, assembler?: TabularPropertyAssembler) {
        super(params, assembler);
        this.layout = {
            cols: params.layout.cols
        }
        this._plugins = null;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): BasicTableProperty;

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @param excludePlugins
     *  If true, plugins will not be installed on the cloned property.
     *  (Default: false)
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: TabularPropertyAssembler, excludePlugins?: boolean): BasicTableProperty
    public override clone(assembler?: TabularPropertyAssembler, excludePlugins: boolean = false): BasicTableProperty {
        // Create property
        let prop = new BasicTableProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            layout: {
                cols  : this.layout.cols
            }
        }, assembler);
        // Clone plugins
        if(!excludePlugins) {
            this._plugins?.forEach(({ plugin }) => prop.tryInstallPlugin(plugin));
        }
        // Clone values
        for(let [id, row] of this._value) {
            prop.insertRow([id, row.map(o => o.clone())]);
        }
        // Return
        return prop;
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
    public tryInstallPlugin(plugin: Plugin<BasicTableProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<BasicTableProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<BasicTableProperty>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }

}
