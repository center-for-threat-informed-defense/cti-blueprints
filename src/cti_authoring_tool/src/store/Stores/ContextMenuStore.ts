import Configuration from "@/assets/configuration/app.config";
import * as App from "@/assets/scripts/Commands/AppCommands";
import { Module } from "vuex";
import { ContextMenuStore, ModuleStore } from "../StoreTypes";
import { ContextMenu, ContextMenuItem, ContextMenuSection, MenuType } from "@/assets/scripts/ContextMenuTypes";

export default {
    namespaced: true,
    getters: {


        ///////////////////////////////////////////////////////////////////////
        //  1. File Menu  /////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the file menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The file menu.
         */
        fileMenu(_s, getters, rootState): ContextMenu {
            // Sections
            let sections: ContextMenuSection[] = [
                getters.openFileMenu,
                getters.saveFileMenu
            ].filter(Boolean);
            // Menu
            return { text: "File", type: MenuType.Submenu, sections };
        },

        /**
         * Returns the 'open file' menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The 'open file' menu section.
         */
        openFileMenu(_s, _g, rootState): ContextMenuSection {
            let ctx = rootState.ApplicationStore;
            let file = ctx.settings.hotkeys.file;
            
            // Create file types
            let nfo: ContextMenuItem[] = Configuration.templates.map(t => ({
                text: t.name,
                type: MenuType.Item,
                data: () => App.LoadFile.fromNew(ctx, t)
            }));
            
            return {
                id: "open_file_options",
                items: [
                    {
                        text: "New File",
                        type: MenuType.Submenu,
                        sections: [
                            {
                                id: "new_file_options",
                                items: nfo
                            }
                        ]
                    },
                    {
                        text: `Open File...`,
                        type: MenuType.Item,
                        data: () => App.LoadFile.fromFileSystem(ctx),
                        shortcut: file.open_file,
                        disabled: true
                    }
                ],
            }
        },
        
        /**
         * Returns the 'save file' menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The 'save file' menu section.
         */
        saveFileMenu(_s, _g, rootState): ContextMenuSection {
            let ctx = rootState.ApplicationStore;
            let file = ctx.settings.hotkeys.file;
            let page = ctx.activeEditor.page;
            return {
                id: "save_file_options",
                items: [
                    {
                        text: "Save",
                        type: MenuType.Item,
                        data: () => new App.SavePageToDevice(ctx, page.id),
                        shortcut: file.save_file,
                        disabled: true
                    }
                ]
            }
        },


        ///////////////////////////////////////////////////////////////////////
        //  2. Edit Menus  ////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the edit menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @returns
         *  The edit menu.
         */
        editMenu(_s, getters): ContextMenu {
            return {
                text: "Edit",
                type: MenuType.Submenu,
                sections: [
                    getters.undoRedoMenu
                ]
            }
        },

        /**
         * Returns the undo/redo menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @param rootGetters
         *  The Vuex root getters.
         * @returns
         *  The undo/redo menu section.
         */
        undoRedoMenu(_s, _g, rootState, rootGetters): ContextMenuSection {
            let ctx = rootState.ApplicationStore;
            let page = ctx.activeEditor.page;
            let edit = ctx.settings.hotkeys.edit;
            let canUndo = rootGetters["ApplicationStore/canUndo"];
            let canRedo = rootGetters["ApplicationStore/canRedo"];
            return {
                id: "undo_redo_options",
                items: [
                    {
                        text: "Undo",
                        type: MenuType.Item,
                        data: () => new App.UndoPageCommand(ctx, page.instance),
                        shortcut: edit.undo,
                        disabled: !canUndo
                    },
                    {
                        text: "Redo",
                        type: MenuType.Item,
                        data: () => new App.RedoPageCommand(ctx, page.instance),
                        shortcut: edit.redo,
                        disabled: !canRedo
                    }
                ],
            }
        },


        ///////////////////////////////////////////////////////////////////////
        //  3. Layout Menus  //////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the time menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @returns
         *  The time menu.
         */
        layoutMenu(_s, getters): ContextMenu {
            return {
                text: "Layout",
                type: MenuType.Submenu,
                sections: [
                ]
            };
        },

        
        ///////////////////////////////////////////////////////////////////////
        //  4. View Menus  ////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the view menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @returns
         *  The view menu.
         */
        viewMenu(_s, getters): ContextMenu {
            return {
                text: "View",
                type: MenuType.Submenu,
                sections: [
                    getters.fullscreenMenu,
                ]
            }
        },

        /**
         * Returns the fullscreen menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The fullscreen menu section.
         */
        fullscreenMenu(_s, _g, rootState): ContextMenuSection {
            let ctx = rootState.ApplicationStore;
            let view = ctx.settings.hotkeys.view;
            return {
                id: "fullscreen_options",
                items: [
                    {
                        text: "Fullscreen",
                        type: MenuType.Item,
                        data: () => new App.SwitchToFullscreen(),
                        shortcut: view.fullscreen,
                    }
                ],
            };
        },

        
        ///////////////////////////////////////////////////////////////////////
        //  5. Help Menu  /////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the help menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The help menu.
         */
        helpMenu(_s, _g, rootState): ContextMenu {
            let ctx = rootState.ApplicationStore;
            let links = Configuration.menus.help_menu.help_links;
            // Links
            let items: ContextMenu[] = links.map(link => ({
                text: link.text,
                type: MenuType.Item,
                data: () => new App.OpenHyperlink(link.url)
            }));
            // Menu
            return {
                text: "Help",
                type: MenuType.Submenu,
                sections: [
                    { id: "help_links", items }
                ]
            };
        }

    }

} as Module<ContextMenuStore, ModuleStore>
