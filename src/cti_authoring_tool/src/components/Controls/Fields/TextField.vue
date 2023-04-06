<template>
  <FocusBox
    :class="['text-field-control', alignment]"
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
        :options="suggestions"
        :maxHeight="maxHeight"
        @select="updatePropertyFromSuggestion"
        v-if="select !== null"
      />
    </div>
    <div class="value">
      <textarea
        v-model="value"
        ref="field"
        placeholder="Null"
        @input="onInput"
        @keyup.stop=""
        @keydown.stop="onKeyDown"
      ></textarea>
    </div>
  </FocusBox>
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { MD5 } from "@/assets/scripts/Utilities";
import { Alignment } from "@/assets/scripts/AppConfiguration";
import { StringProperty } from "@/assets/scripts/Page/Property/";
import { defineComponent, PropType, ref } from "vue";
// Components
import FocusBox from "@/components/Containers/FocusBox.vue";
import OptionsList from "./OptionsList.vue";

export default defineComponent({
  name: "TextField",
  setup() {
    return { field: ref<HTMLElement | null>(null) };
  },
  props: {
    property: {
      type: Object as PropType<StringProperty>,
      required: true
    },
    maxHeight: {
      type: Number,
      default: 200
    }
  },
  data() {
    return {
      value: "",
      select: null as string | null,
      onResizeObserver: null as ResizeObserver | null
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
          return "align-top align-left";
        case Alignment.TopCenter:
          return "align-top align-center";
        case Alignment.TopRight:
          return "align-top align-right";
        case Alignment.MiddleLeft:
          return "align-middle align-left";
        case Alignment.MiddleCenter:
          return "align-middle align-center";
        case Alignment.MiddleRight:
          return "align-middle align-right";
        case Alignment.BottomLeft:
          return "align-bottom align-left";
        case Alignment.BottomCenter:
          return "align-bottom align-center";
        case Alignment.BottomRight:
          return "align-bottom align-right";
      }
    },

    /**
     * Returns the field's suggestions.
     * @returns
     *  The field's suggestions.
     */
    suggestions(): { id: string, text: string }[] {
      let suggestions = [];
      let v = this.value.toLocaleLowerCase();
      for(let i = 0; i < this.property.suggestions.length; i++) {
        let text = this.property.suggestions[i];
        if(text.toLocaleLowerCase().includes(v)) {
          suggestions.push({ id: MD5(text), text });
        }
      }
      return suggestions;
    }

  },
  emits: ["command"],
  methods: {
    
    /**
     * Field focus in behavior.
     */
    onFocusIn() {
      // Focus field
      this.field!.focus();
      // Prompt suggestions
      if(this.value === "") {
        this.promptSuggestions();
      }
      // Execute select command
      this.$emit("command", new App.SelectProperty(this.property));
    },

    /**
     * Field focus out behavior.
     */
    onFocusOut() {
      // Stop suggestions
      this.stopSuggestions();
      // Execute deselect command
      this.$emit("command", new App.DeselectProperty(this.property));
    },

    /**
     * Field input behavior.
     */
    onInput() {
      this.updateProperty(this.value);
      this.promptSuggestions();
    },

    /**
     * Field keydown behavior.
     * @param event
     *  The keydown event.
     */
    onKeyDown(event: KeyboardEvent) {
      let field = event.target as HTMLInputElement;
      if(field.selectionStart !== field.selectionEnd) {
        return;
      }
      let s = this.suggestions;
      let idx = s.findIndex(o => o.id === this.select);
      let canAcceptSuggestion;
      switch(event.key) {
        case "ArrowUp":
          if(0 < idx) {
            this.select = s[idx - 1].id;
          }
          if(this.select !== null) {
            event.preventDefault();
          }
          break;
        case "ArrowDown":
          if(idx < s.length - 1) {
            this.select = s[idx + 1].id;
          }
          if(this.select !== null) {
            event.preventDefault();
          }
          break;
        case "Tab":
          canAcceptSuggestion = idx !== -1;
          canAcceptSuggestion &&= this.value !== "";
          canAcceptSuggestion &&= this.value !== s[idx].text;
          if(canAcceptSuggestion) {
            this.updatePropertyFromSuggestion(s[idx].id);
            this.stopSuggestions();
            event.preventDefault();
          }
          break;
        case "Enter":
          canAcceptSuggestion = idx !== -1;
          canAcceptSuggestion &&= this.value !== s[idx].text;
          if(canAcceptSuggestion) {
            this.updatePropertyFromSuggestion(s[idx].id);
            this.stopSuggestions();
            event.preventDefault();
          }
          break;
      }
    },

    /**
     * Prompts zero or more suggestions.
     */
    promptSuggestions() {
      let isExactTextMatch = this.value === this.suggestions[0]?.text;
      let isSingleSuggestion = this.suggestions.length === 1;
      if(isExactTextMatch && isSingleSuggestion) {
        this.select = null;
        return;
      }
      this.select = null;
      let v = this.value.toLocaleLowerCase();
      for(let s of this.suggestions) {
        if(s.text.toLocaleLowerCase().includes(v)) {
          this.select = s.id;
          return;
        }
      }
    },

    /**
     * Stops the suggestion prompt.
     */
    stopSuggestions() {
      this.select = null;
    },

    /**
     * Updates the field's property value from a suggestion.
     * @param hash
     *  The suggestion's hash.
     */
    updatePropertyFromSuggestion(hash: string) {
      let suggestion = this.suggestions.find(o => o.id === hash);
      if(suggestion) {
        this.updateProperty(suggestion.text);
      }
    },

    /**
     * Updates the field's property value.
     * @param value
     *  The property's new value.
     */
    updateProperty(value: string) {
      // Update value
      if(this.property.value !== value) {
        let v = value || null;
        // Execute update command
        this.$emit("command", new Page.SetStringProperty(this.property, v));
      }
      // Refresh value
      this.refreshValue();
    },

    /**
     * Updates the field's text value.
     */
    refreshValue() {
      // Update value
      this.value = this.property.value ?? "";
      // Update height
      this.$nextTick(() => {
        this.refreshHeight();
      }); 
    },

    /**
     * Updates the field's height.
     */
    refreshHeight() {
      // If no field, bail
      if(this.field === null) {
        return;
      }
      // Collapse and calculate height
      this.field.style.height = "0px";
      this.field.style.height = `${ this.field.scrollHeight }px`
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
    // Configure resize observer
    this.onResizeObserver = new ResizeObserver(() => {
      this.refreshHeight()
    });
    this.onResizeObserver.observe(this.field!);
    // Update field property value
    this.refreshValue();
    // Execute mount command
    this.$emit("command", new App.MountProperty(this.property, this.$el))
  },
  unmounted() {
    // Disconnect resize observer
    this.onResizeObserver!.disconnect();
    // Execute destroy command
    this.$emit("command", new App.DestroyProperty(this.property));
  },
  components: { FocusBox, OptionsList }
});
</script>

<style scoped>

/** === Main Field === */

.text-field-control {
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
}

.text-field-control:focus {
  outline: none;
}

.text-field-control.align-top .value {
  align-items: flex-start;
}
.text-field-control.align-middle .value {
  align-items: center;
}
.text-field-control.align-bottom .value {
  align-items: flex-end;
}

.value {
  position: relative;
  display: flex;
  grid-area: 1 / 1;
  cursor:text
}

textarea {
  display: block;
  width: 100%;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  margin: 6px 12px;
  border: none;
  padding: 0px;
  background: none;
  overflow: hidden;
  resize: none;
}

textarea::placeholder {
  color: #999;
  opacity: 1;
}

textarea:focus {
  outline: none;
}

.options-container {
  position: relative;
  grid-area: 1 / 1;
}

.align-left textarea {
  text-align: left;
}
.align-center textarea {
  text-align: center;
}
.align-right textarea {
  text-align: right;
}

</style>
