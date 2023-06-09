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
import * as AppCommands from "@/assets/scripts/Application/Commands";
import * as PageCommands from "@/assets/scripts/PageEditor/Commands";
// Dependencies
import { clamp } from "@/assets/scripts/Utilities";
import { defineComponent, PropType, ref } from "vue";
import { Alignment, IntegerProperty, NumberProperty } from "@/assets/scripts/Page";

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
  emits: ["execute"],
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
      let cmd = PageCommands.selectAtomicProperty(this.property);
      this.$emit("execute", cmd);
    },

    /**
     * Field deselect behavior.
     */
    onDeselect() {
      // Update property
      this.updateProperty(0);
      // Execute deselect command
      let cmd = PageCommands.deselectAtomicProperty(this.property)
      this.$emit("execute", cmd);
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
        if(this.property instanceof IntegerProperty) {
          value = Math.round(value);
        }
      }
      if(this.property.value !== value) {
        // Execute update command
        let cmd = PageCommands.setNumberProperty(this.property, value);
        this.$emit("execute", cmd);
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
    let cmd = AppCommands.mountProperty(this.property, this.$el);
    this.$emit("execute", cmd);
  },
  unmounted() {
    // Execute destroy command
    let cmd = AppCommands.destroyProperty(this.property);
    this.$emit("execute", cmd);
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
