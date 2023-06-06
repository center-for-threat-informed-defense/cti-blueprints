import { Property } from "@/assets/scripts/Page/Property/Property"
import { PageEditor } from "@/assets/scripts/PageEditor/PageEditor"
import { AppSettings } from "@/assets/scripts/Application/AppSettings"

/**
 * Central Module Store
 */
export type ModuleStore = {
    ApplicationStore: ApplicationStore,
    ContextMenuStore: ContextMenuStore,
    HotkeyStore: HotkeyStore
}

/**
 * Application Store
 */
export type ApplicationStore = {
    editors: Map<string, PageEditor>,
    activeEditor: PageEditor,
    activeProperty: null | Property
    settings: AppSettings,
}

/**
 * Context Menu Store
 */
export type ContextMenuStore = {}

/**
 * Hotkey Store
 */
export type HotkeyStore = {}
