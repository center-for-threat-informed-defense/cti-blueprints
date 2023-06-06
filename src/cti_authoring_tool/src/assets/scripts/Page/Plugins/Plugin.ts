import { PluginModule } from "./PluginModule";

export interface Plugin<T> {
    module   : PluginModule<T>;
    options? : () => any;
}
