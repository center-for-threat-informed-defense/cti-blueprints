<template>
  <FocusBox
    :class="['enum-field-control', alignment]"
    tabindex="0"
    pointerEvent="click"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div class="options-container">
      <OptionsList 
        class="options-list"
        :align="property.alignment"
        :select="select"
        :options="options"
        :maxHeight="maxHeight"
        @select="updateProperty"
        v-if="showMenu"
      />
    </div>
    <div class="value-container">
      <div 
        :class="['value-text', { 'is-null': isNull }]"
        v-show="!showSearch"
      >
        {{ selectText }}
      </div>
      <input 
          type="text" 
          ref="search"
          class="value-search"
          placeholder="Search"
          @input="onSearchInput"
          @keyup.stop=""
          @keydown.stop="onSearchKeyDown"
          v-model="searchTerm"
          v-show="showSearch"
        />
      <div class="dropdown-arrow">▼</div>
    </div>
  </FocusBox>
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { Alignment } from "@/assets/scripts/AppConfiguration";
import { EnumProperty } from "@/assets/scripts/Page/Property";
import { defineComponent, PropType, ref } from "vue";
// Components
import FocusBox from "@/components/Containers/FocusBox.vue";
import OptionsList from "./OptionsList.vue";

export default defineComponent({
  name: "EnumField",
  setup() {
    return { search: ref<HTMLElement | null>(null) };
  },
  props: {
    property: {
      type: Object as PropType<EnumProperty>,
      required: true
    },
    maxHeight: {
      type: Number,
      default: 200
    }
  },
  data() {
    return {
      select: this.property.value,
      showMenu: false,
      showSearch: false,
      searchTerm: ""
    }
  },
  computed: {

    /**
     * Returns the field's alignment classes.
     * @returns
     *  The field's alignment classes.
     */
    alignment(): string {
      switch(this.property.alignment) {
        case Alignment.TopLeft:
        case Alignment.MiddleLeft:
        case Alignment.BottomLeft:
          return "align-left";
        case Alignment.TopCenter:
        case Alignment.MiddleCenter:
        case Alignment.BottomCenter:
          return "align-center";
        case Alignment.TopRight:
        case Alignment.MiddleRight:
        case Alignment.BottomRight:
          return "align-right";
      }
    },

    /**
     * Tests if the null option is selected.
     * @returns
     *  True if the null option is selected, false otherwise.
     */
    isNull(): boolean {
      return this.property.value === null;
    },
    
    /**
     * Returns the enum's options.
     * @returns
     *  The enum's options.
     */
    options(): { id: string | null, text: string }[] {
      let options: { id: string | null, text: string }[] = [];
      if(this.searchTerm === "") {
        options.push({ id: null, text: "Null" });
      }
      let st = this.searchTerm.toLocaleLowerCase();
      for(let [id, { text }] of this.property.options) {
        if(st === "" || text.toLocaleLowerCase().includes(st)) {
          options.push({ id, text });
        }
      }
      return options;
    },

    /**
     * Returns the enum's current selection text.
     * @returns
     *  The enum's current selection text.
     */
    selectText(): string {
      if(this.select !== null) {
        return this.property.options.get(this.select)!.text
      } else {
        return "Null";
      }
    },

    /**
     * Returns the scrollbox's style.
     * @returns
     *  The scrollbox's style.
     */
    style(): { maxHeight: string } {
      return { maxHeight: `${ this.maxHeight }px` };
    }

  },
  emits: ["command"],
  methods: {

    /**
     * Field focus in behavior.
     */
    onFocusIn() {
      // Open menu
      this.showMenu = true;
      // Show search
      this.showSearch = true;
      // Focus search
      setTimeout(() => {
        this.search?.focus();
      }, 0);
      // Execute select command
      this.$emit("command", new App.SelectProperty(this.property));
    },

    /**
     * Field focus out behavior.
     */
    onFocusOut() {
      // Close menu
      this.showMenu = false;
      // Hide search
      this.showSearch = false;
      this.searchTerm = "";
      // Refresh value
      this.refreshValue();
      // Execute deselect command
      this.$emit("command", new App.DeselectProperty(this.property));
    },

    /**
     * Search field input behavior.
     */
    onSearchInput() {
      this.select = null;
      if(this.searchTerm === "") {
        this.select = this.property.value;
        return;
      }
      let st = this.searchTerm.toLocaleLowerCase();
      for(let [key, { text }] of this.property.options) {
        if(text.toLocaleLowerCase().includes(st)) {
          this.select = key;
          return;
        }
      }
    },

    /**
     * Search field keydown behavior.
     * @param event
     *  The keydown event.
     */
    onSearchKeyDown(event: KeyboardEvent) {
      let field = event.target as HTMLInputElement;
      if(field.selectionStart !== field.selectionEnd) {
        return;
      }
      let idx;
      let options = this.options;
      switch(event.key) {
        case "ArrowUp":
          idx = options.findIndex(o => o.id === this.select);
          if(0 < idx) {
            this.select = options[idx - 1].id;
          }
          break;
        case "ArrowDown":
          idx = options.findIndex(o => o.id === this.select);
          if(idx < options.length - 1) {
            this.select = options[idx + 1].id;
          }
          break;
        case "Tab":
        case "Enter":
          this.updateProperty(this.select);
          // Force search field out of focus
          this.search!.blur();
          break;
      }
    },

    /**
     * Updates the field's property value.
     * @param value
     *  The property's new value.
     */
    updateProperty(value: string | null) {
      if(this.property.value !== value) {
        // Execute update command
        this.$emit("command", new Page.EnumPropertySet(this.property, value));
      }
    },

    /**
     * Updates the field's text value.
     */
    refreshValue() {
      this.select = this.property.value
    }
    
  },
  watch: {
    "property"() {
      // Refresh value
      this.refreshValue();
    },
    "property.value"() {
      // Refresh value
      this.refreshValue();
    }
  },
  mounted() {
    // Update field property value
    this.refreshValue();
    // Execute mount command
    this.$emit("command", new App.MountProperty(this.property, this.$el));
  },
  unmounted() {
    // Execute destroy command
    this.$emit("command", new App.DestroyProperty(this.property));
  },
  components: { FocusBox, OptionsList }
});
</script>

<style scoped>

/** === Main Field === */

.enum-field-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  color: #000;
  font-size: 10.5pt;
  font-weight: 500;
  border: solid 1px #d9d9d9;
  border-bottom: solid 1px #cccccc;
  border-radius: 3px;
  box-sizing: border-box;
  cursor: pointer;
}

/** === Value Text === */

.value-container {
  position: relative;
  grid-area: 1 / 1;
  display: flex;
  align-items: center;
}

.value-text {
  flex: 1;
  user-select: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 6px 12px;
  overflow: hidden;
}

.value-text.is-null {
  color: #999;
}

.value-text:not(.is-null) {
  color: #000;
}

.value-search {
  flex: 1;
  height: 100%;
  min-width: 0px;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  padding: 6px 8px 6px 12px;
  border: none;
  box-sizing: border-box;
  background: none;
}

.value-search::placeholder {
  color: #999;
  opacity: 1;
}

.value-search:focus {
  outline: none;
}

.align-left .value-text,
.align-left .value-search {
  text-align: left;
}
.align-center .value-text,
.align-center .value-search {
  text-align: center;
}
.align-right .value-text,
.align-right .value-search {
  text-align: right;
}

.dropdown-arrow {
  color: #666666;
  font-size: 6pt;
  font-family: "Inter", sans-serif;
  text-align: center;
  user-select: none;
  width: 16px;
  padding-right: 8px;
}

/** === Dropdown Options === */

.options-container {
  position: relative;
  grid-area: 1 / 1;
}

</style>
