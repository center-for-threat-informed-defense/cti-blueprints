<template>
  <TabularField class="complex-table-field-control" :property="property" @execute="c => $emit('execute', c)">
    <template #table-header>
      <th class="head-cell data-column">
        <span class="text">
          <span>{{ property.name }}</span>
        </span>
      </th>
    </template>
    <template #table-row="{ key, row }">
      <td :class="['data-column', { collapsed: property.collapsed.get(key) }]">
        <div class="data-region-header" @click="onCollapse(key)">
          <p class="arrow"></p>
          <p class="text">
            <template v-for="(item, i) of summarize(property.layout.summary, row)" :key="i">
              <span :class="item.format">{{ item.text }}</span>
            </template>
          </p>
        </div>
        <FieldGrid 
          v-if="!property.collapsed.get(key)"
          class="data-region-body" 
          :rows="property.layout.rows"
          :cols="property.layout.cols"
          :properties="row"
          @execute="c => $emit('execute', c)"
        />
      </td>
    </template>
  </TabularField>
</template>

<script lang="ts">
import * as PageCommands from "@/assets/scripts/PageEditor/Commands";
// Dependencies
import { defineComponent, PropType } from "vue";
import { ComplexTableProperty, FormattedText, Property, Sort, SummaryParser, TableColumnState } from "@/assets/scripts/Page";
// Components
import TabularField from "./TabularField.vue";

export default defineComponent({
  name: "ComplexTableField",
  props: {
    property: {
      type: Object as PropType<ComplexTableProperty>,
      required: true
    }
  },
  emits: ["execute"],
  methods: {
    
    /**
     * Summarizes a row using a summary template.
     * @param summary
     *  The summary string template.
     * @param row
     *  The row.
     * @returns
     *  The summary.
     */
    summarize(summary: string, row: Property[]): FormattedText[] {
      return SummaryParser.parse(summary, row);
    },

    /**
     * Row collapse behavior.
     * @param id
     *  The row's id.
     */
    onCollapse(id: string) {
      // Determine collapse state
      let c = !this.property.collapsed.get(id);
      // Collapse
      let cmd = PageCommands.collapseComplexTablePropertyRow(this.property, id, c);
      this.$emit("execute", cmd);
    }

  },
  beforeCreate() {
    this.$options.components!.FieldGrid = require("./FieldGrid.vue").default;
  },
  components: { 
    TabularField
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
  padding: 0px 12px;
}

/** === Table Data Cells === */

.data-field {
  height: inherit;
}

.data-region-header {
  display: flex;
  align-items: center;
  color: #fff;
  user-select: none;
  padding: 10px 12px;
  border: solid 1px #1f85cf;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  background: #1f85cf;
  cursor: pointer;
}

.data-region-header .text {
  white-space: pre-wrap
}

span.normal {
  font-size: 10pt;
  font-weight: 600;
}

span.bold {
  font-weight: 600;
  font-size: 10.5pt;
}

.arrow {
  color: #fff;
  font-size: 6pt;
  padding-right: 12px;
}

.arrow::before {
  content: "▼";
}

.collapsed .data-region-header {
  color: #000;
  border: solid 1px #d9d9d9;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  background: #fff;
}

.collapsed .data-region-header:hover {
  background: #f5f5f5;
}

.collapsed span.normal {
  color: #1c7abe;
}

.collapsed span.bold {
  color: #000;
}

.collapsed .arrow {
  color: #595959;
}

.collapsed .arrow::before {
  content: "▶";
}

.data-region-body {
  padding: 25px;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  background: #ededed;
}

</style>
