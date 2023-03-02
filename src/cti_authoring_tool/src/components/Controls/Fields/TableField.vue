<template>
  <div class="table-field-control">
    <table>
      <thead class="head-row">
        <th class="head-cell move-column">
          <span class="icon"><MoveArrow /></span>
        </th>
        <template v-for="p of header" :key="p.id">
          <th class="head-cell data-column" :colspan="getColspan(p)" @click="onSort(p)">
            <span class="text">
              <span class="arrow">{{ getSortArrow(p) }}</span>
              <span>{{ p.name }}</span>
            </span>
          </th>
        </template>
        <th class="head-cell delete-column">
          <span class="icon"><Trash /></span>
        </th>
      </thead>
      <tbody ref="table">
        <tr class="body-row" v-for="[k, r] of property.value" :key="k">
          <td class="move-column" @pointerdown="onStartDrag(k, $event)">
            <span class="icon"><MoveDots /></span>
          </td>
          <template v-for="p of r" :key="p.id">
            <td class="data-column" :colspan="getColspan(p)">
              <component
                :is="getField(p.type)"
                :property="p"
                @command="c => $emit('command', c)"
              />          
            </td>
          </template>
          <td class="delete-column" @click="onDelete(k)">
            <span class="icon">✗</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="actions">
      <button @click="onCreate">+ Add</button>
    </div>
  </div>
</template>

<script lang="ts">

import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { clamp } from "@/assets/scripts/Utilities";
import { Property } from "@/assets/scripts/Page/Property";
import { TableProperty } from "@/assets/scripts/Page/Property/TableProperty";
import { PointerTracker } from "@/assets/scripts/Utilities/PointerTracker";
import { defineComponent, markRaw, PropType, ref } from "vue";
import { AtomicPropertyTemplate, PropertyType, Sort } from "@/assets/scripts/AppConfiguration";
// Components
import Trash from "@/components/Icons/Trash.vue";
import MoveDots from "@/components/Icons/MoveDots.vue";
import MoveArrow from "@/components/Icons/MoveArrow.vue";
import TextField from "@/components/Controls/Fields/TextField.vue";

export default defineComponent({
  name: "TableField",
  setup() {
    return { 
      table: ref<HTMLElement | null>(null)
    };
  },
  props: {
    property: {
      type: Object as PropType<TableProperty>,
      required: true
    }
  },
  data() {
    return {
      pointer: markRaw(new PointerTracker()),
      onResizeObserver: null as ResizeObserver | null
    }
  },
  computed: {

    /**
     * Returns the table's header.
     * @returns
     *  The table's header.
     */
    header(): AtomicPropertyTemplate[] {
      return this.property.header;
    }

  },
  emits: ["command"],
  methods: {

    /**
     * Row create behavior.
     */
    onCreate() {
      let cmd = new Page.CreateRowTableProperty(this.property);
      this.$emit("command", cmd);
    },

    /**
     * Row delete behavior.
     * @param id
     *  The row's id.
     */
    onDelete(id: string) {
      let cmd = new Page.DeleteRowTableProperty(this.property, id);
      this.$emit("command", cmd);
    },

    /**
     * Row sort behavior.
     * @param prop
     *  The property to sort on.
     */
    onSort(prop: AtomicPropertyTemplate) {
      // Determine next sort order
      let s: Sort;
      switch(prop.sort) {
        case Sort.Descending:
          s = Sort.Ascending;
          break;
        case Sort.Ascending:
        case Sort.None:
        default:
          s = Sort.Descending;
          break;
      }
      // Sort
      let cmd = new Page.ReorderTableProperty(this.property, prop.id, s);
      this.$emit("command", cmd);
    },

    /**
     * Row start drag behavior.
     * @param id
     *  The row's id.
     * @param event
     *  The pointer event.
     */
    onStartDrag(id: string, event: PointerEvent) {
      let row = (event.target! as HTMLElement).closest("tr")!;
      // Configure row classes
      for(let el of this.table!.children) {
        if(el === row) {
          el.classList.add("grabbed");
        } else {
          el.classList.add("not-grabbed");
        }
      }
      // Resolve row bounds
      let rows: { el: Element, minY: number, maxY: number }[] = [];
      for(let row of this.table!.children) {
        let bounds = row.getBoundingClientRect();
        rows.push({ 
          el: row,
          minY: bounds.y,
          maxY: bounds.y + bounds.height
        });
      }
      // Resolve row index
      let src = [...this.table!.children].indexOf(row);
      // Resolve row min and max
      let min = rows.at(0)!.minY - rows[src].minY;
      let max = rows.at(-1)!.maxY - rows[src].maxY;
      // Capture pointer
      let state = { id, src, dst: src, min, max, rows };
      this.pointer.capture(event, (_, track) => {
        this.onDrag(track, state);
      }, (_, track) => {
        this.onStopDrag(track, state);
      });
    },

    /**
     * Row drag behavior.
     * @param track
     *  The mouse tracker.
     * @param state
     *  The drag state.
     */
    onDrag(track: PointerTracker, state: any) {
      let { src, min, max, rows } = state;
      let row = rows[src].el;
      // Determine row position
      let y = clamp(track.deltaY, min, max);
      // Apply row position
      row.style.transform = `translate(0px, ${ y }px)`;
      // Swap rows
      let bounds = row.getBoundingClientRect();
      let minY = bounds.y;
      let maxY = minY + bounds.height;
      let height = (maxY - minY) + 8;
      // Configure dst index
      state.dst = state.src;
      // Swap rows above index
      for(let i = 0, s = false; i < src; i++) {
        let r = rows[i];
        if(!s && minY <= r.maxY && maxY >= r.minY) {
          state.dst = i;
          s = true;
        }
        let tx = s ? `translate(0px, ${ height }px)` : "";
        r.el.style.transform = tx;
      }
      // Swap rows below index
      for(let i = rows.length - 1, s = false; i > src; i--) {
        let r = rows[i];
        if(!s && minY <= r.maxY && maxY >= r.minY) {
          state.dst = i;
          s = true;
        }
        let tx = s ? `translate(0px, -${ height }px)` : "";
        r.el.style.transform = tx;
      }
    },

    /**
     * Row stop drag behavior.
     * @param track
     *  The mouse tracker.
     * @param state
     *  The drag state.
     */
    onStopDrag(track: PointerTracker, state: any) {
      let { id, src, dst, rows } = state;
      // Clear row css
      for(let r of rows) {
        r.el.classList.remove("grabbed", "not-grabbed");
        r.el.style.transform = "";
      }
      // If no movement
      if(src === dst) {
        return;
      }
      // If movement
      let cmd = new Page.MoveRowTableProperty(this.property, id, dst);
      this.$emit("command", cmd);
    },

    /**
     * Returns a property's column span.
     * @param prop
     *  The property.
     * @returns
     *  The property's column span.
     */
    getColspan(prop: AtomicPropertyTemplate | Property) {
      return Array.isArray(prop.col) ? prop.col[1] - prop.col[0] : 1;
    },

    /**
     * Returns a property's sort arrow.
     * @param prop
     *  The property.
     * @returns
     *  The property's sort arrow.
     */
    getSortArrow(prop: AtomicPropertyTemplate): string {
        switch(prop.sort) {
            case Sort.Descending:
            case Sort.None:
                return "▼";
            case Sort.Ascending:
                return "▲";
            default:
                return "?";
        }
    },

    /**
     * Returns a property's field type.
     * @param type
     *  The type of property.
     * @returns
     *  The property's field type.
     */
    getField(type: PropertyType): string | undefined {
      switch(type) {
        case PropertyType.String:
          return "TextField";
      }
    }

  },
  watch: {
    "property"() {
    },
    "property.value"() {
    }
  },
  mounted() {
    // Configure resize observer
    // this.onResizeObserver = new ResizeObserver(() => this.refreshHeight());
    // this.onResizeObserver.observe(this.field!);
    // // Update field property value
    // this.refreshValue();
    // // Execute mount command
    // this.$emit("command", new Page.MountProperty(this.property, this.$el))
  },
  unmounted() {
    // // Disconnect resize observer
    // this.onResizeObserver!.disconnect();
    // // Execute destroy command
    // this.$emit("command", new Page.DestroyProperty(this.property));
  },
  components: { Trash, MoveDots, MoveArrow, TextField }
});
</script>

<style scoped>

/** === Main Field === */

.table-field-control {
  color: #cccccc;
}

/** === Table === */

table {
  width: 100%;
  table-layout: fixed;
  /* border-spacing: 0px; */
  border-spacing: 6px 8px;
}

th, td {
  padding: 0px;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.head-cell {
  color: #595959;
  font-size: 10.5pt;
  font-weight: 600;
  border-radius: 3px;
  height: 33px;
  background: #ededed;
  user-select: none;
}

.head-cell .text {
  display: flex;
  align-items: center;
}

.head-cell .arrow {
  display: inline-block;
  font-size: 6pt;
  padding: 0px 8px;
}

.head-cell.data-column {
  cursor: pointer;
}

.head-cell.data-column:hover {
  background: #e0e0e0;
}

.move-column {
  width: 29px;
}

.delete-column {
  width: 31px;
}

.body-row {
  transition: .15s opacity;
}

.body-row .move-column,
.body-row .delete-column {
  color: #808080;
  font-size: 12.5pt;
  font-weight: 400;
  border: solid 1px #d9d9d9;
  border-radius: 3px;
  user-select: none;
}

.body-row .move-column:hover,
.body-row .delete-column:hover {
  background: #f0f0f0;
}

.body-row .move-column {
  cursor: grab;
}

.body-row td {
  background: #fff;
}

.body-row.grabbed {
  position: relative;
  z-index: 1;
}

.body-row.grabbed .move-column {
  cursor: grabbing;
}

.body-row.not-grabbed {
  transition: .15s all;
  opacity: 0.55;
}

/** === Actions === */

.actions {
  margin: 12px 0px 0px;
}

button {
  color: #ffffff;
  font-size: 10pt;
  font-weight: 600;
  padding: 8px 11px;
  border: solid 1px #1f85cf;
  border-radius: 3px;
  background: #1f85cf;
  user-select: none;
}

button:hover {
  background: #379ae1;
}

tr.phantom td {
  background: #000;
}

</style>
