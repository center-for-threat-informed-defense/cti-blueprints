import { AtomicProperty } from "..";
import { PlugableElement } from "../../PlugableElement";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { EnumPropertyParameters } from "./EnumPropertyParameters";

export class EnumProperty extends AtomicProperty implements PlugableElement<EnumProperty> {

    /**
     * The property's set of options.
     */
    public readonly options: ReadonlyMap<string, string>

    /**
     * The property's value.
     */
    private _value: string | null;

    /**
     * The property's valid set of options.
     */
    private _validOptions: Map<string, string> | null;
    
    /**
     * The property's plugin manager.
     */
    private _plugins: PluginManager<EnumProperty> | null;

    
    /**
     * The property's value.
     */
    public get value(): string | null {
        return this._value;
    }

    /**
     * The property value's setter.
     */
    public set value(value: string | null) {
        let lastValue = this._value;
        if(value === null) {
            this._value = null;
        } else if(this.validOptions.has(value)) {
            this._value = value;
        } else {
            throw new Error(`Enum value '${ value }' is not a valid option.`);
        }
        this.emit("update", this, lastValue);
    }

    /**
     * The property's valid set of options.
     */
    public get validOptions(): ReadonlyMap<string, string> {
        if(this._validOptions === null) {
            return this.options
        } else {
            return this._validOptions;
        }
    }


    /**
     * Creates a new {@link EnumProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: EnumPropertyParameters);

    /**
     * Creates a new {@link EnumProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: EnumPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: EnumPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
        // Validate options
        let options = new Map();
        for(let option of params.options) {
            let { value, text } = option;
            if(!options.has(value)) {
                options.set(value, text)
            } else {
                throw new Error("All enum values must be unique.");
            }
        }
        this.options = options;
        // Set value
        this._value = null;
        this._plugins = null;
        this._validOptions = null;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. Property Cloning  /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Clones the property.
     * @returns
     *  The cloned property.
     */
    public override clone(): EnumProperty;

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
    public override clone(assembler?: PropertyAssembler, excludePlugins?: boolean): EnumProperty;
    public override clone(assembler?: PropertyAssembler, excludePlugins: boolean = false): EnumProperty {
        // Clone options
        let options = [...this.options.entries()]
            .map(([ value, text ]) => ({ value, text }));
        // Create property
        let prop = new EnumProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment,
            options
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
    public tryInstallPlugin(plugin: Plugin<EnumProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<EnumProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<EnumProperty>[]): boolean {
        let result = true;
        for(let plugin of plugins) {
            result &&= this.tryInstallPlugin(plugin);
        }
        return result;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  3. toString  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public override toString(): string {
        return this._value !== null ? this.options.get(this._value)! : "";
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  4. Options Filter  ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Restricts the enum's valid set of options.
     * @param allowed
     *  The allowed set of options specified by id.
     */
    public restrictOptions(allowed: string[]) {
        this._validOptions = new Map();
        for(let id of allowed) {
            let option = this.options.get(id);
            if(option) {
                this._validOptions.set(id, option);
            }
        }
        // Update value
        if(this._value && !this._validOptions.has(this._value)) {
            this.value = null;
        }
    }

    /**
     * Sets the enum's valid set of options back to the full set of options.
     */
    public unrestrictOptions() {
        this._validOptions = null;
    }

}
