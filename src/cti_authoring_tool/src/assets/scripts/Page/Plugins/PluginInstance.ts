import { Plugin } from "./Plugin";

export type PluginInstance<T> = {
    plugin   : Plugin<T>,
    instance : Object
};
