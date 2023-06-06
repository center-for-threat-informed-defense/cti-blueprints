import { AtomicProperty } from "..";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { EnumPropertyParameters } from "./EnumPropertyParameters";

export class EnumProperty extends AtomicProperty {

    /**
     * The property's set of options.
     */
    public readonly options: ReadonlyMap<string, { text: string, value: any }>

    /**
     * The property's value.
     */
    private _value: string | null;

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
        } else if(this.options.has(value)) {
            this._value = value;
        } else {
            throw new Error(`Enum value '${ value }' is not a valid option.`);
        }
        this.emit("update", this._value, lastValue);
    }

    /**
     * The property's enum value.
     */
    public get enumValue(): any {
        return this._value === null ? null : this.options.get(this._value)!.value;
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
            let { id, text, value } = option;
            if(!options.has(id)) {
                options.set(id, { text, value })
            } else {
                throw new Error("All enum ids must be unique.");
            }
        }
        this.options = options;
        // Set value
        this._value = null;
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
    public override clone(): EnumProperty;

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: PropertyAssembler): EnumProperty {
        // Clone options
        let options = [...this.options.entries()].map(o => ({ 
            id    : o[0], 
            text  : o[1].text,
            value : o[1].value
        }));
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
        // Clone values
        prop.value = this._value;
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            prop.tryInstallPlugin(plugin)
        });
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
    public override toString(): string | undefined {
        return this._value !== null ? this.options.get(this._value)!.text : undefined;
    }

}
