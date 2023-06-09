import { clamp } from "@/assets/scripts/Utilities";
import { NumberProperty } from "./NumberProperty";
import { PlugableElement } from "../../PlugableElement";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { NumberPropertyParameters } from "./NumberPropertyParameters";

export class FloatProperty extends NumberProperty implements PlugableElement<FloatProperty> {

    /**
     * The property's plugin manager.
     */
    protected _plugins: PluginManager<FloatProperty> | null;


    /**
     * The property's value.
     */
    public override get value(): number | null {
        return this._value;
    }

    /**
     * The property value's setter.
     */
    public override set value(value: number | null) {
        let lastValue = this._value;
        if(value === null) {
            this._value = value;
        } else {
            this._value = clamp(value, this.min, this.max);
        }
        this.emit("update", this, lastValue);
    }


    /**
     * Creates a new {@link FloatProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: NumberPropertyParameters);

    /**
     * Creates a new {@link FloatProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
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
    public override clone(): FloatProperty;

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
    public override clone(assembler?: PropertyAssembler, excludePlugins?: boolean): FloatProperty
    public override clone(assembler?: PropertyAssembler, excludePlugins: boolean = false): FloatProperty {
        // Create property
        let prop = new FloatProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment,
            min       : this.min,
            max       : this.max
        }, assembler);
        // Clone plugins
        if(!excludePlugins) {
            this._plugins?.forEach(({ plugin }) => prop.tryInstallPlugin(plugin));
        }
        // Clone values
        prop.value = this._value;
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
    public tryInstallPlugin(plugin: Plugin<FloatProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<FloatProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<FloatProperty>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }

}
