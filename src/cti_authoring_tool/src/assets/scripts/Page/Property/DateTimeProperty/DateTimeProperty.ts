import { AtomicProperty } from "..";
import { PlugableElement } from "../../PlugableElement";
import { PropertyAssembler } from "../PropertyAssembler";
import { Plugin, PluginManager } from "../../Plugins";
import { AtomicPropertyParameters } from "../AtomicProperty/AtomicPropertyParameters";

export class DateTimeProperty extends AtomicProperty implements PlugableElement<DateTimeProperty> {

    /**
     * The property's value.
     */
    private _value: Date | null;

    /**
     * The property's plugin manager.
     */
    protected _plugins: PluginManager<DateTimeProperty> | null;


    /**
     * The property value's getter.
     */
    public override get value(): Date | null {
        return this._value;
    }

    /**
     * The property value's setter.
     */
    public override set value(value: Date | string | null) {
        let _value = this._value;
        if(value === null) {
            this._value = null;
        } else if(typeof value === "string") {
            this._value = new Date(value);
        } else {
            this._value = value;
        }
        let lastValue = _value === null ? null : new Date(_value);
        this.emit("update", this, lastValue);
    }


    /**
     * Creates a new {@link DateTimeProperty}.
     * @param params
     *  The property's parameters.
     */
    constructor(params: AtomicPropertyParameters);

    /**
     * Creates a new {@link DateTimeProperty}.
     * @param params
     *  The property's parameters.
     * @param assembler
     *  The property's assembler.
     */
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler);
    constructor(params: AtomicPropertyParameters, assembler?: PropertyAssembler) {
        super(params, assembler);
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
    public override clone(): DateTimeProperty;

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
    public override clone(assembler?: PropertyAssembler, excludePlugins?: boolean): DateTimeProperty;
    public override clone(assembler?: PropertyAssembler, excludePlugins: boolean = false): DateTimeProperty {
        // Create property
        let prop = new DateTimeProperty({
            id        : this.id,
            name      : this.name,
            path      : this.path,
            link      : this.link,
            row       : this.row,
            col       : this.col,
            required  : this.required,
            alignment : this.alignment
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
    public tryInstallPlugin(plugin: Plugin<DateTimeProperty>): boolean {
        let result;
        // Don't allocate manager until absolutely necessary
        if(this._plugins === null) {
            this._plugins = new PluginManager<DateTimeProperty>(this, this.root);
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
    public tryInstallPlugins(plugins: Plugin<DateTimeProperty>[]): boolean {
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
        return this._value !== null ? `${ this._value }` : "";
    }

}
