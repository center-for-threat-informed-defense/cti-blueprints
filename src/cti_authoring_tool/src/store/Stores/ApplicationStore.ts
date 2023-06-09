import { Module } from "vuex"
import { PageEditor } from "@/assets/scripts/PageEditor/PageEditor";
import { AppCommand } from "@/assets/scripts/Application/Commands";
import { PageCommand } from "@/assets/scripts/PageEditor/Commands";
import { BaseAppSettings } from "@/assets/scripts/Application";
import { ModuleStore, ApplicationStore } from "@/store/StoreTypes"

export default {
    namespaced: true,
    state: {
        editors: new Map([[PageEditor.Phantom.id, PageEditor.Phantom]]),
        activeEditor: PageEditor.Phantom,
        activeProperty: null,
        settings: BaseAppSettings
    },
    getters: {

        /**
         * Tests if the last command on the active page can be undone.
         * @returns
         *  True if the last command can be undone, false otherwise.
         */
        canUndo(state): boolean {
            return state.activeEditor.canUndo();
        },

        /**
         * Tests if the last undone command on the active page can be redone.
         * @returns
         *  True if the last undone command can be redone, false otherwise.
         */
        canRedo(state): boolean {
            return state.activeEditor.canRedo();
        }

    },
    mutations: {

        /**
         * Executes an application command.
         * @param state
         *  The Vuex state. 
         * @param command
         *  The application command.
         */
        execute(state, command: AppCommand | PageCommand) {
            if(command instanceof PageCommand) {
                // Execute command
                let editor = state.editors.get(command.page);
                if(editor) {
                    editor.execute(command);
                } else {
                    throw new Error(
                        `'${ command.page }' is not a page.`
                    );
                }
            } else {
                command.execute();
            }
        }

    }
} as Module<ApplicationStore, ModuleStore>
