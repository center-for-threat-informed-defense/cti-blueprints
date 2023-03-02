<template>
  <div class="text-field-control" tabindex="0" @focus="onFocus()">
    <textarea
      v-model="value"
      ref="field"
      placeholder="Null"
      @focus="onSelect"
      @input="onInput"
      @keyup.stop=""
      @keydown.stop=""
      @blur="onDeselect"
    ></textarea>
  </div>
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { StringProperty } from "@/assets/scripts/Page/Property/StringProperty/StringProperty";
import { defineComponent, PropType, ref } from "vue";

export default defineComponent({
  name: "TextField",
  setup() {
    return { field: ref<HTMLElement | null>(null) };
  },
  props: {
    property: {
      type: Object as PropType<StringProperty>,
      required: true
    }
  },
  data() {
    return {
      value: "",
      onResizeObserver: null as ResizeObserver | null
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
      // Update value
      if(this.property.value !== this.value) {
        // Execute update command
        this.$emit("command", new Page.SetStringProperty(this.property, this.value));
      }
      // Refresh value
      this.refreshValue();
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
      // Execute deselect command
      this.$emit("command", new App.DeselectProperty(this.property));
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
    this.onResizeObserver = new ResizeObserver(() => this.refreshHeight());
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
  }
});
</script>

<style scoped>

/** === Main Field === */

.text-field-control {
  display: flex;
  align-items: center;
  color: #000;
  font-size: 10.5pt;
  font-weight: 500;
  border: solid 1px #d9d9d9;
  border-radius: 3px;
  min-height: 30px;
  cursor: text;
  overflow: hidden;
}

.text-field-control:focus {
  outline: none;
}

textarea {
  display: block;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  width: 100%;
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

</style>
