<template>
  <AppHotkeyBox id="main">
    <AppTitleBar id="app-title-bar"/>
    <!-- <div class id="tool-bar"></div> -->
    <div id="app-body">
      <ScrollBox id="page-container" :alwaysShowScrollBar="true">
        <PageEditorControl id="page" :page="editor.page" @execute="onExecute" />
      </ScrollBox>
    </div>
    <FileSelect 
      id="file-select"
      :active="editor.id"
      :editors="editors" 
      @close="onEditorClose"
      @switch="onEditorSwitch"
      v-show="0 < editors.size"
    />
    <div class id="footer-bar"></div>
  </AppHotkeyBox>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
import * as AppCommands from "@/assets/scripts/Application/Commands";
import Configuration from "@/assets/configuration/app.config"
// Dependencies
import { Command } from "./assets/scripts/Application/Command";
import { PageEditor } from "./assets/scripts/PageEditor/PageEditor";
import { defineComponent } from 'vue';
import { mapMutations, mapState } from 'vuex';
// Components
import ScrollBox from "./components/Containers/ScrollBox.vue";
import FileSelect from "./components/Controls/FileSelect.vue";
import AppTitleBar from "./components/Elements/AppTitleBar.vue";
import AppHotkeyBox from "./components/Elements/AppHotkeyBox.vue";
import PageEditorControl from "./components/Controls/PageEditor.vue";

export default defineComponent({
  name: 'App',
  computed: {

    /**
     * Application Store data
     */
    ...mapState<any, {
      ctx     : (state: Store.ApplicationStore) => Store.ApplicationStore,
      editor  : (state: Store.ApplicationStore) => PageEditor,
      editors : (state: Store.ApplicationStore) => Map<string, PageEditor>
    }>("ApplicationStore", {
      ctx(state: Store.ApplicationStore): Store.ApplicationStore {
        return state;
      },
      editor(state: Store.ApplicationStore): PageEditor {
        return state.activeEditor;
      },
      editors(state: Store.ApplicationStore): Map<string, PageEditor> {
        let editors = [...state.editors.entries()]
          .filter(o => o[0] !== PageEditor.Phantom.id)
        return new Map(editors);
      }
    })

  },
  methods: {

    /**
     * Application Store actions
     */
    ...mapMutations("ApplicationStore", ["execute"]),

    /**
     * Page execute behavior.
     * @param emitter
     *  The page's command.
     */
    async onExecute(cmd: Command) {
      try {
        if(cmd instanceof Promise) {
          this.execute(await cmd);
        } else {
          this.execute(cmd);
        }
      } catch(ex: any) {
        console.error(ex);
      }
    },

    /**
     * Editor switch behavior.
     * @param id
     *  The editor's id.
     */
    onEditorSwitch(id: string) {
      this.execute(AppCommands.switchActivePage(this.ctx, id));
    },

    /**
     * Editor close behavior.
     * @param id
     *  The editor's id.
     */
    onEditorClose(id: string) {
      this.execute(AppCommands.unloadPage(this.ctx, id));
    }


  },
  async created() {
    // Import settings
    let settings;
    if(Configuration.is_web_hosted) {
      settings = await (await fetch("./settings.json")).json();
    } else {
      settings = require("../public/settings.json");
    }
    // Load settings
    this.execute(AppCommands.loadSettings(this.ctx, settings));
  },
  components: {
    ScrollBox, AppTitleBar, AppHotkeyBox, 
    FileSelect, PageEditorControl
  }
});
</script>

<style>

/** === Global === */

html,
body {
  width: 100%;
  height: 100%;
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0px;
  margin: 0px;
  background: #fff;
  overflow: hidden;
}

button {
  font-family: "Inter", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

p {
  margin: 0px;
}

ul {
  margin: 0px;
  padding: 0px;
}

/** === Main App === */

#app {
  width: 100%;
  height: 100%;
}

#main {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

#app-title-bar {
  flex-shrink: 0;
  height: 31px;
  color: #616161;
  background: #fff;
  border-color: #d9d9d9;
}

#app-body {
  flex: 1;
  overflow: hidden;
  background: url("./assets/images/texture.png");
}

#tool-bar, #footer-bar {
  flex-shrink: 0;
  height: 31px;
}

#tool-bar {
  border-bottom: solid 1px #d9d9d9;
}

#footer-bar {
  border-top: solid 1px #bfbfbf;
}

#page-container {
  width: 100%;
  height: 100%;
}

#page {
  width: 950px;
  margin: auto;
}

</style>
