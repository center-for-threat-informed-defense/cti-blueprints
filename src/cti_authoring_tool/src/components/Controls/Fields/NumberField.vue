<template>
  <div :class="['number-field-control', alignment]" tabindex="0" @focus="onFocus()">
    <input
      v-model="value"
      type="text"
      ref="field"
      placeholder="Null"
      @focus="onSelect"
      @input="onInput"
      @keyup.stop=""
      @keydown.stop="onKeyDown"
      @blur="onDeselect"
    />
    <div class="increment-arrows">
      <div class="up-arrow" @click="updateProperty(+1)">▲</div>
      <div class="down-arrow" @click="updateProperty(-1)">▼</div>
    </div>
  </div>
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { clamp } from "@/assets/scripts/Utilities";
import { NumberProperty } from "@/assets/scripts/Page/Property";
import { Alignment, PropertyType } from "@/assets/scripts/AppConfiguration";
import { defineComponent, PropType, ref } from "vue";

export default defineComponent({
  name: "NumberField",
  setup() {
    return { field: ref<HTMLInputElement | null>(null) };
  },
  props: {
    property: {
      type: Object as PropType<NumberProperty>,
      required: true
    }
  },
  data() {
    return {
      value: ""
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
    }

  },
  emits: ["command"],
  methods: {

    /**
     * Field focus behavior.
     */
    onFocus() {
      // Set focus
      this.field!.focus();
    },

    /**
     * Field input behavior.
     */
    onInput() {
      if(this.value === "") {
        this.updateProperty(0);
      }
    },

    /**
     * Field select behavior.
     */
    onSelect() {
      // Execute select command
      this.$emit("command", new App.SelectProperty(this.property));
    },

    /**
     * Field deselect behavior.
     */
    onDeselect() {
      // Update property
      this.updateProperty(0);
      // Execute deselect command
      this.$emit("command", new App.DeselectProperty(this.property));
    },

    /**
     * Field keydown behavior.
     * @param event
     *  The keydown event.
     */
    onKeyDown(event: KeyboardEvent) {
      switch(event.key) {
        case "ArrowUp":
          event.preventDefault();
          this.updateProperty(+1);
          break;
        case "ArrowDown":
          event.preventDefault();
          this.updateProperty(-1);
          break;
      }
    },

    /**
     * Updates the field's property value.
     * @param delta
     *  The amount to add to the parsed value.
     *  (Default: 0)
     */
    updateProperty(delta: number = 0) {
      let value: null | number;
      if(this.value === "" && delta === 0) {
        // Parse null
        value = null;
      } else {
        // Parse value
        value = parseFloat(this.value);
        if(Number.isNaN(value)) {
          value = 0;
        } else {
          value += delta;
        }
        // Bound value
        let { min, max } = this.property;
        value = clamp(value, min, max);
        // Bound type
        if(this.property.type === PropertyType.Integer) {
          value = Math.round(value);
        }
      }
      if(this.property.value !== value) {
        // Execute update command
        this.$emit("command", new Page.SetNumberProperty(this.property, value));
      }
      // Refresh value
      this.refreshValue();  
    },

    /**
     * Updates the field's text value.
     */
    refreshValue() {
      // Update value
      if(this.property.value === null) {
        this.value = "";
      } else {
        this.value = `${ this.property.value }`;
      }
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
    this.$emit("command", new App.MountProperty(this.property, this.$el))
  },
  unmounted() {
    // Execute destroy command
    this.$emit("command", new App.DestroyProperty(this.property));
  }
});
</script>

<style scoped>

/** === Main Field === */

.number-field-control {
  display: flex; 
  align-items: center;
  color: #000;
  font-size: 10.5pt;
  font-weight: 500;
  border: solid 1px #d9d9d9;
  border-bottom: solid 1px #cccccc;
  border-radius: 3px;
  box-sizing: border-box;
  cursor: text;
  overflow: hidden;
}

.number-field-control:focus {
  outline: none;
}

input {
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  width: 100%;
  height: 100%;
  padding: 6px 8px 6px 12px;
  border: none;
  box-sizing: border-box;
  background: none;
}

input::placeholder {
  color: #999;
  opacity: 1;
}

input:focus {
  outline: none;
}

.align-left input {
  text-align: left;
}
.align-center input {
  text-align: center;
}
.align-right input {
  text-align: right;
}

/** === Arrows === */

.increment-arrows {
  display: flex;
  flex-direction: column;
  color: #666666;
  font-size: 5pt;
  font-family: "Inter", sans-serif;
  user-select: none;
  width: 16px;
  padding-right: 8px;
}

.up-arrow, .down-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 10px;
  border-radius: 2px;
  cursor: pointer;
}

.up-arrow:hover, .down-arrow:hover {
  color: #bfbfbf;
}

</style>
