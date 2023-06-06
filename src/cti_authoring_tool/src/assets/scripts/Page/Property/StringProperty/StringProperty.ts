import { AtomicProperty } from "..";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export class StringProperty extends AtomicProperty {
    
    /**
     * The property's string suggestions.
     */
    public suggestions: string[];

    /**
     * The property's value.
     */
    private _value: string | null;

    /**
     * The property's plugin manager.
     */
    private _plugins: PluginManager<StringProperty> | null;


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
        this._value = value;
        this.emit("update", this._value, lastValue);
    }

    
    /**
     * Creates a new {@link StringProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: AtomicPropertyParameters);

    /**
     * Creates a new {@link StringProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
        this.suggestions = [];
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
    public override clone(): StringProperty

    /**
     * Clones the property.
     * @param assembler
     *  The cloned property's assembler.
     * @returns
     *  The cloned property.
     */
    public override clone(assembler?: PropertyAssembler): StringProperty {
        // Create property
        let prop = new StringProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment
        }, assembler);
        // Clone values
        prop.value = this._value;
        prop.suggestions = [...this.suggestions];
        // Clone plugins
        this._plugins?.forEach(({ plugin }) => {
            prop.tryInstallPlugin(plugin);
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
    public tryInstallPlugin(plugin: Plugin<StringProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<StringProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<StringProperty>[]): boolean {
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
        return this._value ?? undefined;
    }

}
