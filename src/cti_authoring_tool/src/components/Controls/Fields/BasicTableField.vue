<template>
  <TabularField class="basic-table-field-control" :property="property" @command="c => $emit('command', c)">
    <template #table-header="{ columns }">
      <template v-for="prop of columns" :key="prop.id">
        <th class="head-cell data-column" :colspan="getColspan(prop)" @click="onSort(prop)">
          <span class="text">
            <span class="arrow">{{ getSortArrow(prop) }}</span>
            <span>{{ prop.name }}</span>
          </span>
        </th>
      </template>
    </template>
    <template #table-row="{ row }">
      <template v-for="prop of row" :key="prop.id">
        <td class="data-column" :colspan="getColspan(prop)">
          <component
            class="data-field"
            :is="getField(prop.type)"
            :property="prop"
            @command="c => $emit('command', c)"
          />          
        </td>
      </template>
    </template>
  </TabularField>
</template>

<script lang="ts">
import * as Page from "@/assets/scripts/Commands/PageCommands";
// Dependencies
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { defineComponent, PropType } from "vue";
import { BasicTableProperty, Property, Sort, TablePropertyState } from "@/assets/scripts/Page/Property";
// Components
import TextField from "./TextField.vue";
import EnumField from "./EnumField.vue";
import NumberField from "./NumberField.vue";
import TabularField from "./TabularField.vue";
import DateTimeField from "./DateTimeField.vue";

export default defineComponent({
  name: "BasicTableField",
  props: {
    property: {
      type: Object as PropType<BasicTableProperty>,
      required: true
    }
  },
  emits: ["command"],
  methods: {
    
    /**
     * Returns a property's column span.
     * @param prop
     *  The property.
     * @returns
     *  The property's column span.
     */
    getColspan(prop: TablePropertyState | Property) {
      return Array.isArray(prop.col) ? (prop.col[1] + 1) - prop.col[0] : 1;
    },

    /**
     * Returns a property's sort arrow.
     * @param prop
     *  The property.
     * @returns
     *  The property's sort arrow.
     */
    getSortArrow(prop: TablePropertyState): string {
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
        case PropertyType.Float:
        case PropertyType.Integer:
          return "NumberField";
        case PropertyType.Date:
        case PropertyType.Time:
        case PropertyType.DateTime:
          return "DateTimeField";
        case PropertyType.Enum:
          return "EnumField";
      }
    },
    
    /**
     * Row sort behavior.
     * @param prop
     *  The property to sort on.
     */
    onSort(prop: TablePropertyState) {
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
      let cmd = new Page.TabularPropertyReorder(this.property, prop.id, s);
      this.$emit("command", cmd);
    }

  },
  components: { 
    TabularField, TextField, EnumField, 
    NumberField, DateTimeField
  }
});
</script>

<style scoped>

/** === Table === */

.body-row td {
  height: inherit;
  background: #fff;
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

/** === Table Data Cells === */

.data-field {
  height: inherit;
}

</style>
