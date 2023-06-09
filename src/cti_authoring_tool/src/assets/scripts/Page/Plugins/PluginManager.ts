import { Plugin } from "./Plugin";
import { PageElement } from "../PageElement";
import { PluginInstance } from "./PluginInstance";
import { ReactivitySystem } from "../ReactivitySystem";

export class PluginManager<T extends PageElement> extends Array<PluginInstance<T>> {
    
    /**
     * The page element.
     */
    public readonly element: T;

    /**
     * The page's root element.
     */
    private readonly _root: PageElement;


    /**
     * Creates a new {@link PluginManager}.
     * @param element
     *  The page element.
     * @param root
     *  The page's root element.
     */
    constructor(element: T, root: PageElement) {
        
        // Configure state
        super();
        this._root = root;
        this.element = element;
        
        // Make state reactive if working in a reactive context
        if(ReactivitySystem.makeReactive) {
            this._root = ReactivitySystem.makeReactive(this._root);
            this.element = ReactivitySystem.makeReactive(this.element);
        }

    }


    /**
     * Attempts to install a plugin.
     * @param plugin
     *  The plugin to install.
     * @returns
     *  True if the plugin was successfully installed, false otherwise.
     */
    public tryInstallPlugin(plugin: Plugin<T>): boolean;
    public tryInstallPlugin(plugin: Plugin<T>): boolean {
        // Ensure plugin is not already installed
        let name = plugin.module.name;
        if(this.find(o => o.plugin.module.name === name)) {
            throw new Error(`Plugin '${ name }' is already installed.`);
        }
        // Instantiate plugin
        let instance;
        try {
            if(plugin.options) {
                instance = new plugin.module(this.element, this._root, plugin.options());
            } else {
                instance = new plugin.module(this.element, this._root);
            }
        } catch(err) {
            let name = plugin.module.name;
            console.error(`Failed to install plugin '${ name }':`);
            console.error(err);
            return false;
        }
        // Install plugin
        this.push({ plugin, instance });
        return true;
    }

}
