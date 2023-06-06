import { PageElement } from "../PageElement";

export type PluginModule<T> = new (property: T, root: PageElement, options?: any) => any 
