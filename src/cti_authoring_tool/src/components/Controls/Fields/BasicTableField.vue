<template>
  <TabularField class="basic-table-field-control" :property="property" @execute="c => $emit('execute', c)">
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
            :is="getField(prop)"
            :property="prop"
            @execute="c => $emit('execute', c)"
          />          
        </td>
      </template>
    </template>
  </TabularField>
</template>

<script lang="ts">
import * as PageCommands from "@/assets/scripts/PageEditor/Commands";
// Dependencies
import { defineComponent, PropType } from "vue";
import { 
    BasicTableProperty, DateProperty, DateTimeProperty, 
    EnumProperty, FloatProperty, IntegerProperty, Property,
    Sort, StringProperty, TableColumnState, TimeProperty
} from "@/assets/scripts/Page/Property";
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
  emits: ["execute"],
  methods: {
    
    /**
     * Returns a property's column span.
     * @param prop
     *  The property.
     * @returns
     *  The property's column span.
     */
    getColspan(prop: TableColumnState | Property) {
      return Array.isArray(prop.col) ? (prop.col[1] + 1) - prop.col[0] : 1;
    },

    /**
     * Returns a property's sort arrow.
     * @param prop
     *  The property.
     * @returns
     *  The property's sort arrow.
     */
    getSortArrow(prop: TableColumnState): string {
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
     * @param property
     *  The property.
     * @returns
     *  The property's field type.
     */
    getField(property: Property): string | undefined {
      switch(property.constructor.name) {
        case StringProperty.name:
          return "TextField";
        case FloatProperty.name:
        case IntegerProperty.name:
          return "NumberField";
        case DateProperty.name:
        case TimeProperty.name:
        case DateTimeProperty.name:
          return "DateTimeField";
        case EnumProperty.name:
          return "EnumField";
      }
    },
    
    /**
     * Row sort behavior.
     * @param prop
     *  The property to sort on.
     */
    onSort(prop: TableColumnState) {
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
      let cmd = PageCommands.reorderTabularProperty(this.property, prop.id, s);
      this.$emit("execute", cmd);
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
