import { IProperty } from "./IProperty";
import { PageSection } from "../PageSection";
import { EventEmitter, String } from "../../Utilities";
import { PagePropertyTemplate, Plugin, PropertyTemplate, PropertyType } from "../../AppConfiguration";
import { DateTimeProperty, EnumProperty, NumberProperty, StringProperty, BasicTableProperty, ComplexTableProperty } from "./";

export abstract class Property extends EventEmitter implements IProperty {

    /**
     * The property's id.
     */
    public readonly id: string;

    /**
     * The property's name.
     */
    public readonly name: string;

    /**
     * The property's type.
     */
    public readonly type: PropertyType;

    /**
     * The property's row.
     */
    public readonly row: number | [number, number];

    /**
     * The property's column.
     */
    public readonly col: number | [number, number];

    /**
     * The property's help link.
     */
    public readonly help: string | null;

    /**
     * The property's primary status.
     */
    public readonly isPrimary: boolean;

    /**
     * The property's plugins.
     */
    protected _plugins: Object[];

    /**
     * The property's actions
     */
    protected _actions: any[];

    /**
     * The property's section.
     */
    protected _section: PageSection;


    /**
     * Creates a new {@link Property}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     */
    constructor(section: PageSection, template: PropertyTemplate) {
        super();
        this._section = section;
        this.id = template.id ?? String.formatId(template.name);
        this.name = template.name;
        this.type = template.type;
        this.row = template.row;
        this.col = template.col;
        this.help = template.help ?? null;
        this.isPrimary = template.is_primary ?? false;
        this._plugins = [];
        this._actions = [];
    }

    /**
     * Returns the instance id of the page the property belongs to.
     * @returns
     *  The instance id of the page the property belongs to.
     */
    public getPageInstance(): string {
        return this._section.getPageInstance();
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. IProperty Methods  ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Registers a property action.
     * @param name
     *  The action's name.
     * @param action
     *  The action.
     */
    public registerAction(name: string, action: () => void): void {
        // TODO: Implement action registration
        throw new Error("Method not implemented.");
    }

    /**
     * Adds an event listener to the property.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired.
     */
    public override on(event: string, callback: () => void): void {
        super.on(event, callback);
    }
    
    /**
     * Adds an event listener to the property that will be fired once and then
     * removed.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired. 
     */
    public override once(event: string, callback: () => void): void {
        super.on(event, callback);
    }

    /**
     * Removes all event listeners associated with a given event. If no event
     * name is specified, all event listeners are removed.
     * @param event
     *  The name of the event.
     */
    public override removeAllListeners(event?: string): void {
        super.removeAllListeners(event);
    }

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public abstract override toString(): string | undefined;

    
    ///////////////////////////////////////////////////////////////////////////
    ///  2. Event Methods  ////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Property mount behavior.
     * @param el
     *  The property's HTML container.
     */
    public onMount(el: HTMLElement) {
        super.emit("mount", el);
    }

    /**
     * Property destroy behavior.
     */
    public onDestroy() {
        super.emit("destroy");
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  3. Plugins  //////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Initializes all plugins from a property's template.
     * @param template
     *  The property's template.
     */
    protected initializePlugins(template: PropertyTemplate) {
        if(!template.plugins) {
            return;
        }
        for(let plugin of template.plugins) {
            this.tryRegisterPlugin(plugin);
        }
    }

    /**
     * Attempts to register a plugin with the property.
     * @param plugin
     *  The plugin to register.
     * @returns
     *  True if the plugin was successfully registered, false otherwise.
     */
    private tryRegisterPlugin(plugin: Plugin<any>): boolean {
        // Ensure plugin is not already registered
        if(this._plugins.find(o => o.constructor === plugin.plugin)) {
            let name = plugin.plugin.name;
            throw new Error(`Plugin '${ name }' is already registered.`);
        }
        // Register plugin
        let p;
        try {
            if(plugin.options) {
                p = new plugin.plugin(this, plugin.options());
            } else {
                p = new plugin.plugin(this);
            }
        } catch(err) {
            let name = plugin.plugin.name;
            console.error(`Failed to initialize plugin '${ name }':`);
            console.error(err);
            return false;
        }
        this._plugins.push(p);
        return true;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  4. Create Property Method  ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    
    /**
     * Creates a new {@link Property}.
     * @param section
     *  The property's section.
     * @param template
     *  The property's template.
     * @param value
     *  The property's value.
     */
    public static create(section: PageSection, template: PagePropertyTemplate, value?: any): Property {
        switch(template.type) {
            case PropertyType.String:
                return new StringProperty(section, template, value);
            case PropertyType.Integer:
            case PropertyType.Float:
                return new NumberProperty(section, template, value);
            case PropertyType.Date:
            case PropertyType.Time:
            case PropertyType.DateTime:
                return new DateTimeProperty(section, template, value);
            case PropertyType.Enum:
                return new EnumProperty(section, template, value);
            case PropertyType.BasicTable:
                return new BasicTableProperty(section, template, value);
            case PropertyType.ComplexTable:
                return new ComplexTableProperty(section, template, value);
        }
    }

}
