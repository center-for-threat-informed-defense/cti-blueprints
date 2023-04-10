<template>
  <div class="tabular-field-control">
    <table>
      <thead class="head-row">
        <th class="head-cell move-column">
          <span class="icon"><MoveArrow /></span>
        </th>
        <slot name="table-header" :columns="columns">
          <th class="head-cell">[Table-Header]</th>
        </slot>
        <th class="head-cell delete-column">
          <span class="icon"><Trash /></span>
        </th>
      </thead>
      <tbody ref="table">
        <tr class="body-row" v-for="[key, row] of property.value" :key="key">
          <td class="move-column" @pointerdown="onStartDrag(key, $event)">
            <span class="icon"><MoveDots /></span>
          </td>
          <slot name="table-row" :key="key" :row="row">
            <td class="data-column">[Table-Row]</td>
          </slot>
          <td class="delete-column" @click="onDelete(key)">
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
import { PointerTracker } from "@/assets/scripts/Utilities/PointerTracker";
import { TablePropertyState, TabularProperty } from "@/assets/scripts/Page/Property";
import { defineComponent, markRaw, PropType, ref } from "vue";
// Components
import Trash from "@/components/Icons/Trash.vue";
import MoveDots from "@/components/Icons/MoveDots.vue";
import MoveArrow from "@/components/Icons/MoveArrow.vue";

export default defineComponent({
  name: "TabularField",
  setup() {
    return { 
      table: ref<HTMLElement | null>(null)
    };
  },
  props: {
    property: {
      type: Object as PropType<TabularProperty>,
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
     * Returns the table's columns.
     * @returns
     *  The table's columns.
     */
    columns(): TablePropertyState[] {
      return this.property.properties;
    }

  },
  emits: ["command"],
  methods: {

    /**
     * Row create behavior.
     */
    onCreate() {
      let cmd = new Page.TabularPropertyCreateRow(this.property);
      this.$emit("command", cmd);
    },

    /**
     * Row delete behavior.
     * @param id
     *  The row's id.
     */
    onDelete(id: string) {
      let cmd = new Page.TabularPropertyDeleteRow(this.property, id);
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
      this.pointer.capture(
        event, 
        (_, track) => {
          this.onDrag(track, state);
        }, 
        (_, _track) => {
          this.onStopDrag(state);
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
     * @param state
     *  The drag state.
     */
    onStopDrag(state: any) {
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
      let cmd = new Page.TabularPropertyMoveRow(this.property, id, dst);
      this.$emit("command", cmd);
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
  components: { Trash, MoveDots, MoveArrow }
});
</script>

<style scoped>

/** === Main Field === */

.tabular-field-control {
  color: #cccccc;
}

/** === Table === */

table {
  width: 100%;
  height: 0px;
  table-layout: fixed;
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

.body-row {
  height: 100%;
  transition: .15s opacity;
}

.body-row td {
  height: inherit;
  background: #fff;
}

.body-row.grabbed {
  position: relative;
  z-index: 1;
}

.move-column {
  width: 29px;
}

.delete-column {
  width: 31px;
}

/** === Table Head Cells === */

.head-cell {
  color: #595959;
  font-size: 10.5pt;
  font-weight: 600;
  border-radius: 3px;
  height: 33px;
  background: #ededed;
  user-select: none;
}

/** === Table Control Cells === */

.body-row .move-column,
.body-row .delete-column {
  color: #595959;
  font-size: 12.5pt;
  font-weight: 400;
  border-radius: 3px;
  background: #ededed;
  user-select: none;
}

.body-row .move-column:hover,
.body-row .delete-column:hover {
  background: #e0e0e0;
}

.body-row .move-column {
  cursor: grab;
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
