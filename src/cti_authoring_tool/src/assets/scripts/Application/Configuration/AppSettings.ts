/**
 * Base App Settings
 */
export const BaseAppSettings: AppSettings = {
    hotkeys: {
        file: { 
            new_file: "",
            open_file: "",
            save_file: ""
        },
        edit: {
            undo: "",
            redo: ""
        },
        layout: {
        },
        view: {
            fullscreen: ""
        }
    }
}

/**
 * App Settings File
 */
export type AppSettings = {
    hotkeys: {
        file: FileHotkeys,
        edit: EditHotkeys,
        layout: LayoutHotkeys,
        view: ViewHotkeys
    }
}

/**
 * File hotkeys
 */
export type FileHotkeys = { 
    new_file: string,
    open_file: string,
    save_file: string
}

/**
 * Edit hotkeys
 */
export type EditHotkeys = {
    undo: string,
    redo: string
}

/**
 * Layout hotkeys
 */
export type LayoutHotkeys = {
}

/**
 * View hotkeys
 */
export type ViewHotkeys = {
    fullscreen: string
}
