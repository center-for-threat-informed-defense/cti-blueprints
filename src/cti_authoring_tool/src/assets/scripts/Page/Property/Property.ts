import { PageSection } from "../PageSection";
import { PropertyPlugin } from "../PropertyPlugins/PropertyPlugin";
import { PagePropertyTemplate, PropertyTemplate, PropertyType } from "../../AppConfiguration";
import { DateProperty, EnumProperty, NumberProperty, StringProperty, TableProperty } from "./";

export abstract class Property {

    /**
     * The id of the property.
     */
    public id: string;

    /**
     * The name of the property.
     */
    public name: string;

    /**
     * The property's type.
     */
    public type: PropertyType;

    /**
     * The property's row.
     */
    public row: number | [number, number];

    /**
     * The property's column.
     */
    public col: number | [number, number];

    /**
     * The property's primary status.
     */
    public isPrimary: boolean;

    /**
     * The property's plugins.
     */
    protected _plugins: PropertyPlugin[];

    /**
     * The property's actions
     */
    protected _actions: any[];

    /**
     * The property's metrics.
     */
    protected _metrics: any[];

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
        this._section = section;
        this.id = template.id;
        this.name = template.name;
        this.type = template.type;
        this.row = template.row;
        this.col = template.col;
        this.isPrimary = template.is_primary ?? false;
        this._plugins = [];
        this._actions = [];
        this._metrics = [];   
    }


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
                return new DateProperty(section, template, value);
            case PropertyType.Enum:
                return new EnumProperty(section, template);
            case PropertyType.Table:
                return new TableProperty(section, template);
        }
    }

    /**
     * Returns the instance id of the page the property belongs to.
     * @returns
     *  The instance id of the page the property belongs to.
     */
    public getPageInstance(): string {
        return this._section.getPageInstance();
    }


    /**
     * Property update behavior.
     */
    public onUpdate() {
        // Notify plugins
        for(let plugin of this._plugins) {
            plugin.onUpdate();
        }
    }

    /**
     * Property mount behavior.
     * @param el
     *  The property's HTML container.
     */
    public onMount(el: HTMLElement) {
        // Notify plugins
        for(let plugin of this._plugins) {
            plugin.onMount(el);
        }
    }

    /**
     * Property destroy behavior.
     */
    public onDestroy() {
        // Notify plugins
        for(let plugin of this._plugins) {
            plugin.onDestroy();
        }
    }

    /**
     * Returns a string representation of the property.
     * @returns
     *  A string representation of the property.
     */
    public abstract toString(): string | undefined;

}