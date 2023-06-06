import { AtomicProperty } from "..";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { NumberPropertyParameters } from "./NumberPropertyParameters";

export abstract class NumberProperty extends AtomicProperty {

    /**
     * The property's minimum allowed value.
     */
    public readonly min: number;

    /**
     * The property's maximum allowed value.
     */
    public readonly max: number;

    /**
     * The property's value.
     */
    protected _value: number | null;

    /**
     * The property's plugin manager.
     */
    protected _plugins: PluginManager<NumberProperty> | null;

    
    /**
     * The property's value.
     */
    public abstract get value(): number | null;

    /**
     * The property value's setter.
     */
    public abstract set value(value: number | null);


    /**
     * Creates a new {@link NumberProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: NumberPropertyParameters);

    /**
     * Creates a new {@link NumberProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: NumberPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
        this.min = params.min ?? -Infinity;
        this.max = params.max ?? Infinity;
        this._value = null;
        this._plugins = null;
    }

    
    ///////////////////////////////////////////////////////////////////////////
    ///  1. Plugin Management  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Attempts to install a plugin into the property.
     * @param plugin
     *  The plugin to install.
     * @returns
     *  True if the plugin was successfully installed, false otherwise.
     */
    public tryInstallPlugin(plugin: Plugin<NumberProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<NumberProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<NumberProperty>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  2. toString  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string | undefined {
        return this.value !== null ? `${ this.value }` : undefined;
    }

}
