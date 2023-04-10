import { Page } from "./Page";
import { Property } from "./Property";
import { IPageSection } from "./IPagesSection";
import { EventEmitter, String } from "../Utilities";
import { PageSectionTemplate, Plugin } from "../AppConfiguration";

export class PageSection extends EventEmitter implements IPageSection {

    /**
     * The section's id.
     */
    public readonly id: string;

    /**
     * The section's name.
     */
    public readonly name: string;

    /**
     * The section's layout.
     */
    public readonly layout: {
        
        /**
         * The number of rows in the section.
         */
        readonly rows: number,

        /**
         * The number of columns in the section.
         */
        readonly cols: number
    
    };

    /**
     * The section's properties.
     */
    public readonly properties: Map<string, Property>;

    /**
     * True if the section's name should be displayed, false otherwise.
     */
    public readonly isNameDisplayed: boolean;

    /**
     * The section's primary status.
     */
    public readonly isPrimary: boolean;

    /**
     * The page the section belongs to.
     */
    private readonly _page: Page;

    /**
     * The section's plugins.
     */
    private _plugins: Object[];


    /**
     * Creates a new {@link PageSection}.
     * @param page
     *  The page the section belongs to.
     * @param template
     *  The sections's template.
     */
    constructor(page: Page, template: PageSectionTemplate) {
        super();
        // Init state
        this.id = template?.id ?? String.formatId(template.name);
        this.name = template.name;
        this.layout = {
            rows: template.layout.rows,
            cols: template.layout.cols
        }
        this.properties = new Map();
        this.isNameDisplayed = template.is_name_displayed ?? true;
        this.isPrimary = template.is_primary ?? false;
        this._page = page;
        this._plugins = [];
        // Init properties
        for(let t of template.properties) {
            let prop = Property.create(this, t);
            if(!this.properties.has(prop.id)) {
                this.properties.set(prop.id, prop);
            } else {
                throw new Error(`Property '${ 
                    prop.id 
                }' is defined twice in section '${ 
                    this.id
                }'.`);
            }
        }
        // Register plugins
        this.initializePlugins(template);
    }

    /**
     * Returns the instance id of the page the section belongs to.
     * @returns
     *  The instance id of the page the section belongs to.
     */
    public getPageInstance(): string {
        return this._page.instance;
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  1. IPageSection Methods  /////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Adds an event listener to the section.
     * @param event
     *  The event to subscribe to.
     * @param callback
     *  The function to call once the event has fired.
     */
    public override on(event: string, callback: () => void): void {
        super.on(event, callback);
    }
    
    /**
     * Adds an event listener to the section that will be fired once and then
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

    /**
     * Property selection behavior.
     * @param property
     *  The property that was selected.
     */
    public onPropertySelect(property: Property) {
        super.emit("property-select", property);
    }

    /**
     * Property deselect behavior.
     * @param property
     *  The property that was deselected.
     */
    public onPropertyDeselect(property: Property) {
        super.emit("property-deselect", property);
    }

    /**
     * Property update behavior.
     * @param property
     *  The property that was updated.
     * @param newValue
     *  The property's new value.
     * @param oldValue
     *  The property's old value.
     */
    public onPropertyUpdate(property: Property, newValue: any, oldValue: any) {
        super.emit("property-update", property, newValue, oldValue);
    }


    ///////////////////////////////////////////////////////////////////////////
    ///  3. Plugins  //////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Initializes all plugins from a section's template.
     * @param template
     *  The section's template.
     */
    protected initializePlugins(template: PageSectionTemplate) {
        if(!template.plugins) {
            return;
        }
        for(let plugin of template.plugins) {
            this.tryRegisterPlugin(plugin);
        }
    }

    /**
     * Attempts to register a plugin with the section.
     * @param plugin
     *  The plugin to register.
     * @returns
     *  True if the plugin was successfully registered, false otherwise.
     */
    private tryRegisterPlugin(plugin: Plugin<IPageSection>): boolean {
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
            let name = plugin.plugin.constructor.name;
            console.error(`Failed to initialize plugin '${ name }':`);
            console.error(err);
            return false;
        }
        this._plugins.push(p);
        return true;
    }

}
