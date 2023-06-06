import * as AppCommands from "@/assets/scripts/Application/Commands";
import { Module } from "vuex"
import { Hotkey } from "@/assets/scripts/Utilities/HotkeyObserver"
import { PageEditor } from "@/assets/scripts/PageEditor/PageEditor";
import { CommandEmitter } from "@/assets/scripts/Application/Command";
import { HotkeyStore, ModuleStore } from "../StoreTypes";

export default {
    namespaced: true,
    getters: {

        /**
         * Returns the native hotkeys.
         * @returns
         *  The supported native hotkeys.
         */
        nativeHotkeys(): Hotkey<CommandEmitter>[] {
            return [
                {
                    shortcut: "Control+C",
                    repeatable: true,
                    allowBrowserBehavior: true
                },
                {
                    shortcut: "Control+V",
                    repeatable: true,
                    allowBrowserBehavior: true
                },
                {
                    shortcut: "Control+X",
                    repeatable: true,
                    allowBrowserBehavior: true
                },
                {
                    shortcut: "Control+R",
                    repeatable: true,
                    allowBrowserBehavior: true
                },
                {
                    shortcut: "Control+Shift+R",
                    repeatable: true,
                    allowBrowserBehavior: true
                }
            ]
        },

        /**
         * Returns the file hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @param rootGetters
         *  The Vuex root getters.
         * @returns
         *  The file hotkeys.
         */
        fileHotkeys(_s, _g, rootState, rootGetters): Hotkey<CommandEmitter>[] {
            let ctx = rootState.ApplicationStore;
            let page = ctx.activeEditor;
            let file = ctx.settings.hotkeys.file;
            return [
                {
                    data: () => AppCommands.loadPageFromFileSystem(ctx),
                    shortcut: file.open_file,
                    repeatable: false
                },
                {
                    data: () => AppCommands.savePageToDevice(ctx, page.id),
                    shortcut: file.save_file,
                    repeatable: false,
                    disabled: page.id === PageEditor.Phantom.id
                }
            ];
        },

        /**
         * Returns the edit hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The edit hotkeys.
         */
        editHotKeys(_s, _g, rootState): Hotkey<CommandEmitter>[] {
            let ctx = rootState.ApplicationStore;
            let page = ctx.activeEditor.page;
            let edit = ctx.settings.hotkeys.edit;
            return [
                {
                    data: () => AppCommands.undoPageCommand(ctx, page.instance),
                    shortcut: edit.undo,
                    repeatable: true
                },
                {
                    data: () => AppCommands.redoPageCommand(ctx, page.instance),
                    shortcut: edit.redo,
                    repeatable: true
                }
            ];
        },

        /**
         * Returns the layout hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The layout hotkeys.
         */
        layoutHotkeys(_s, _g, rootState): Hotkey<CommandEmitter>[] {
            let ctx = rootState.ApplicationStore;
            return [];
        },

        /**
         * Returns the view hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The view hotkeys.
         */
        viewHotkeys(_s, _g, rootState): Hotkey<CommandEmitter>[] {
            let ctx = rootState.ApplicationStore;
            let view = ctx.settings.hotkeys.view;
            return  [
                {
                    data: () => AppCommands.switchToFullscreen(),
                    shortcut: view.fullscreen,
                    repeatable: false
                }
            ];
        }

    }

} as Module<HotkeyStore, ModuleStore>
