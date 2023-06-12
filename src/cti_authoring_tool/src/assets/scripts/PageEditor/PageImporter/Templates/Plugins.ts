import { Plugin } from "@/assets/scripts/Page/Plugins"
import { PluginTypeClassMap } from "./PluginTypeClassMap";

export type Plugins<T> = 
    Plugin<T>[] | 
    {
        local?: Plugin<T>[],
        global?: {
            [K in keyof typeof PluginTypeClassMap]?: Plugin<InstanceType<typeof PluginTypeClassMap[K]>>[]
        }
    };
