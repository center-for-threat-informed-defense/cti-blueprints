import { Plugin } from "./Plugins/Plugin"

export interface PlugableElement<T> {
    
    /**
     * Attempts to install a plugin into the element.
     * @param plugin
     *  The plugin to install.
     * @returns
     *  True if the plugin was successfully installed, false otherwise.
     */
    tryInstallPlugin(plugin: Plugin<T>): boolean

    /**
     * Attempts to install a list of plugins into the element.
     * @param plugin
     *  The plugins to install.
     * @returns
     *  True if all plugins were successfully installed, false otherwise.
     */
    tryInstallPlugins(plugins: Plugin<T>[]): boolean

}
