<template>
  <div :class="['datetime-field-control', alignment]" tabindex="0" @focus="onFocus()">
    <div class="grid-container">
      <div class="value" v-show="!showEditor">
        <p v-if="property.value === null" class="null-value">
          Null
        </p>
        <p v-else class="date-value">
          <template v-if="includeDate">
            {{ prop_M }} {{ prop_D }}, {{ prop_Y }}
          </template>
          <template v-if="includeDate && includeTime">
            -
          </template>
          <template v-if="includeTime">
            {{ prop_H }}:{{ prop_m }}:{{ prop_s }}
          </template>
        </p>
      </div>
      <div class="editor" v-show="showEditor">
        <template v-if="includeDate">
          <input 
            type="text" maxlength="2" segment="M" ref="M" class="M" placeholder="MM"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_M"
          />
          <span>/</span>
          <input 
            type="text" maxlength="2" segment="D" ref="D" class="D" placeholder="DD"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_D" 
          />
          <span>/</span>
          <input
            type="text" maxlength="4" segment="Y" ref="Y" class="Y" placeholder="YYYY"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_Y" 
          />
        </template>
        <span v-if="includeDate && includeTime" class="space"></span>
        <template v-if="includeTime">
          <input
            type="text" maxlength="2" segment="H" ref="H" class="H" placeholder="HH"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_H" 
          />
          <span>:</span>
          <input
            type="text" maxlength="2" segment="m" ref="m" class="m" placeholder="mm"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_m"   
          />
          <span>:</span>
          <input
            type="text" maxlength="2" segment="s" ref="s" class="s" placeholder="ss"
            @blur="onDeselect" @keyup.stop="" @keydown.stop="onKeyDown" v-model="value_s" 
          />
          <span class="timezone">Z</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { DateTimeProperty } from "@/assets/scripts/Page/Property";
import { Alignment, PropertyType } from "@/assets/scripts/AppConfiguration";
import { defineComponent, PropType, ref } from "vue";

const Segments = [
  "M", "D", "Y",
  "H", "m", "s"
]

const Months = [
  "Jan", "Feb", "Mar", 
  "Apr", "May", "Jun",
  "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"
]

export default defineComponent({
  name: "DateTimeField",
  setup() {
    return { 
      M: ref<HTMLInputElement | null>(null),
      D: ref<HTMLInputElement | null>(null),
      Y: ref<HTMLInputElement | null>(null),
      H: ref<HTMLInputElement | null>(null),
      m: ref<HTMLInputElement | null>(null),
      s: ref<HTMLInputElement | null>(null),
    };
  },
  props: {
    property: {
      type: Object as PropType<DateTimeProperty>,
      required: true
    }
  },
  data() {
    return {
      value_M: "",
      value_D: "",
      value_Y: "",
      value_H: "",
      value_m: "",
      value_s: "",
      showEditor: false
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
     * Returns the currently configured month.
     * @returns
     *  The currently configured month.
     */
    prop_M(): string {
      let v = this.property.value;
      return v ? Months[v.getUTCMonth()] : "Null";
    },

    /**
     * Returns the currently configured day.
     * @returns
     *  The currently configured day.
     */
    prop_D(): string {
      let v = this.property.value;
      return `${ v?.getUTCDate() ?? 'Null' }`;
    },
    
    /**
     * Returns the currently configured year.
     * @returns
     *  The currently configured year.
     */
    prop_Y(): string {
      let v = this.property.value;
      return `${ v?.getUTCFullYear() ?? 'Null' }`;
    },

    /**
     * Returns the currently configured hour.
     * @returns
     *  The currently configured hour.
     */
    prop_H(): string {
      let v = this.property.value;
      return v ? `${ v.getUTCHours() }`.padStart(2, '0') : "Null";
    },

    /**
     * Returns the currently configured minute.
     * @returns
     *  The currently configured minute.
     */
    prop_m(): string {
      let v = this.property.value;
      return v ? `${ v.getUTCMinutes() }`.padStart(2, '0') : "Null";
    },

    /**
     * Returns the currently configured second.
     * @returns
     *  The currently configured second.
     */
    prop_s(): string {
      let v = this.property.value;
      return v ? `${ v.getUTCSeconds() }`.padStart(2, '0') : "Null";
    },

    /**
     * Tests if the field should include time.
     * @returns
     *  True if the field should include time, false otherwise.
     */
    includeTime(): boolean {
      switch(this.property.type) {
        case PropertyType.Time:
        case PropertyType.DateTime:
          return true;
        case PropertyType.Date:
        default:
          return false;
      }
    },

    /**
     * Tests if the field should include date.
     * @returns
     *  True if the field should include date, false otherwise.
     */
    includeDate(): boolean {
      switch(this.property.type) {
        case PropertyType.Date:
        case PropertyType.DateTime:
          return true;
        case PropertyType.Time:
        default:
          return false;
      }
    },

    /**
     * Returns the field's displayed segments.
     * @returns
     *  The field's displayed segment.
     */
    segments(): string[] {
      return Segments.filter(s => (this as any)[s] !== null);
    }

  },
  emits: ["command"],
  methods: {

    /**
     * Field focus behavior.
     */
    onFocus() {
      // Enter edit mode
      this.enterEditMode();
      // Execute select command
      this.$emit("command", new App.SelectProperty(this.property));
    },

    /**
     * Field deselect behavior.
     * @param event
     *  The blur event.
     */
    onDeselect(event: FocusEvent) {
      // Exit edit mode
      if(!this.$el.contains(event.relatedTarget)) {
        this.exitEditMode();
      }
      // Execute deselect command
      this.$emit("command", new App.DeselectProperty(this.property));
    },

    /**
     * Field segment keydown behavior.
     * @param event
     *  The keydown event.
     */
    onKeyDown(event: KeyboardEvent) {
      let field = event.target as HTMLInputElement;
      if(field.selectionStart !== field.selectionEnd) {
        return;
      }
      switch(event.key) {
        case "Backspace":
          if(field.selectionEnd === 0) {
            this.shiftFocus(-1, false);
          }
          break;
        case "ArrowLeft":
          if(field.selectionEnd === 0) {
            this.shiftFocus(-1, false);
            event.preventDefault();
          }
          break;
        case "ArrowRight":
          if(field.selectionEnd === field.maxLength) {
            this.shiftFocus(+1, true);
            event.preventDefault();
          }
          break;
        case "Tab":
          break;
        default:
          if(field.selectionEnd === field.maxLength) {
            this.shiftFocus(+1, true);
          }
      }
    },

    /**
     * Enters edit mode.
     */
    enterEditMode() {
      this.showEditor = true;
      this.$nextTick(() => {
        // Select field
        let field: HTMLInputElement;
        for(let s of this.segments) {
          field = (this as any)[s];
          if(!field.value) break;
        }
        // Focus field
        field!.focus();
        // Position caret
        field!.selectionEnd = field!.value.length;
      })
    },

    /**
     * Exits edit mode.
     */
    exitEditMode() {
      this.updateProperty();
      this.showEditor = false;
    },

    /**
     * Shifts focus from the current segment to an adjacent segment.
     * @param delta
     *  The number of segments to shift over.
     * @param start
     *  [true]
     *   Position caret at the start of the segment.
     *  [false]
     *   Position caret at the end of the segment.
     *  (Default: true)
     */
    shiftFocus(delta: number, start: boolean = true) {
      let field = document.activeElement as HTMLInputElement;
      let index = this.segments.indexOf(field.getAttribute("segment")!) + delta;
      if(0 <= index && index < this.segments.length) {
        this.$nextTick(() => {
          // Get adjacent segment
          let adj: HTMLInputElement = (this as any)[this.segments[index]];
          // Focus adjacent segment
          adj.focus();
          // Position caret
          adj.selectionEnd = start ? 0 : adj.value.length;
        });
      }
    },

    /**
     * Updates the field's property value.
     */
    updateProperty() {
      // Parse date
      let d = `${ 
        this.value_Y.padStart(4, "0")
      }-${
        this.value_M.padStart(2, "0")
      }-${
        this.value_D.padStart(2, "0")
      }`;
      let t = `${
        this.value_H.padStart(2, "0")
      }:${
        this.value_m.padStart(2, "0")
      }:${
        this.value_s.padStart(2, "0")
      }.000Z`;
      if(this.property.type === PropertyType.Date) {
        t = "00:00:00.000Z";
      } else if(this.property.type === PropertyType.Time) {
        d = t === "00:00:00.000Z" ? "0000-00-00" : "1970-01-01";
      }
      let ISO8601 = `${ d }T${ t }`;
      let date = new Date(ISO8601);
      // Parse value
      let value;
      if(ISO8601 === "0000-00-00T00:00:00.000Z") {
        value = null;
      } else if(Number.isNaN(date.getTime())) {
        value = null;
      } else {
        value = date;
      }
      if(this.property.value?.getTime() !== value?.getTime()) {
        // Execute update command
        this.$emit("command", new Page.SetDateTimeProperty(this.property, value));
      }
      // Refresh value
      this.refreshValue();
    },

    /**
     * Updates the field's text value.
     */
    refreshValue() {
      // Parse date
      let date = this.property.value?.toISOString() ?? "--T::";
      let [ Y, M, D, H, m, s ] = date.split(/[-T:\.]/);
      // Update values
      this.value_Y = Y;
      this.value_M = M;
      this.value_D = D;
      this.value_H = H;
      this.value_m = m;
      this.value_s = s;
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

.datetime-field-control {
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

.datetime-field-control:focus {
  outline: none;
}

.grid-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
}

/** === Editor === */

.editor {
  grid-area: 1 / 1;
  display: flex;
  width: 100%;
  padding: 6px 12px;
  border: none;
  box-sizing: border-box;
}

.align-left .editor {
  justify-content: flex-start;
}
.align-center .editor {
  justify-content: center;
}
.align-right .editor {
  justify-content: flex-end;
}

input {
  height: 17px;
  color: inherit;
  font-size: 10pt;
  font-family: "Roboto Mono";
  padding: 0;
  border: none;
  background: none;
}

input::placeholder {
  color: #999;
  opacity: 1;
}

input:focus {
  outline: none;
}

.editor span {
  height: 17px;
  color: #999;
  font-size: 10pt;
  font-family: "Roboto Mono";
  margin: 0px 3px;
}

.editor span.space {
  margin: 0px 3px;
}

.editor span.timezone {
  margin-left: 6px;
}

.M, .D, .H, .m, .s {
  width: 16px;
}

.Y {
  width: 32px;
}

/** === Value === */

.value {
  grid-area: 1 / 1;
  padding: 6px 12px;
}

.align-left .value { 
  text-align: left;
}
.align-center .value { 
  text-align: center;
}
.align-right .value { 
  text-align: right;
}

.null-value {
  color: #999;
}

.date-value {
  height: 17px;
  font-weight: 500;
}

</style>
