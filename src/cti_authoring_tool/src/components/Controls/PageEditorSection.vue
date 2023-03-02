<template>
  <div class="page-editor-section-control" :style="grid">
    <div class="field-container" :style="propGridStyle(p)" v-for="[k, p] in section.properties" :key="k">
      <p class="field-name">
        {{ p.name }}
      </p>
      <component
        class="field-value"
        :is="getField(p.type)"
        :property="p"
        @command="c => $emit('command', c)"
      />
    </div>
  </div> 
</template>

<script lang="ts">
// Dependencies
import { Property } from '@/assets/scripts/Page/Property/Property';
import { PageSection } from '@/assets/scripts/Page/PageSection';
import { PropertyType } from '@/assets/scripts/AppConfiguration';
import { defineComponent, PropType } from 'vue';
// Components
import TextField from "@/components/Controls/Fields/TextField.vue";
import TableField from "@/components/Controls/Fields/TableField.vue";

export default defineComponent({
  name: 'PageSection',
  props: {
    section: {
      type: Object as PropType<PageSection>,
      required: true
    }
  },
  computed: {

    /**
     * Returns the section's grid styling.
     * @returns
     *  The section's grid styling.
     */
    grid() {
      return {
        gridTemplateRows: `repeat(${ this.section.rows }, auto)`,
        gridTemplateColumns: `repeat(${ this.section.cols }, minmax(0, 1fr))`,
      }
    }

  },
  emits: ["command"],
  methods: {
    
    /**
     * Returns a property's grid styling.
     * @returns
     *  The property's grid styling.
     */
    propGridStyle(property: Property) {
      let row = Array.isArray(property.row) ? {
        gridRowStart    : property.row[0],
        gridRowEnd      : property.row[1] 
      } : {
        gridRowStart    : property.row
      }
      let col = Array.isArray(property.col) ? {
        gridColumnStart : property.col[0],
        gridColumnEnd   : property.col[1]
      } : {
        gridColumnStart : property.col
      }
      return { ...row, ...col}
    },

    /**
     * Returns a property's field type.
     * @param
     *  The type of property.
     * @returns
     *  The property's field type.
     */
    getField(type: PropertyType): string | undefined {
      switch(type) {
        case PropertyType.String:
          return "TextField";
        case PropertyType.Table:
          return "TableField";
      }
    }

  },
  components: { TextField, TableField }
});
</script>

<style scoped>

/** === Main Control === */

.page-editor-section-control {
  display: grid;
  column-gap: 15px;
  row-gap: 15px;
  padding: 30px;
  border: solid 1px #d9d9d9;
  border-radius: 3px;
  background: #fff;
  
}

.field-name {
  color: #616161;
  font-size: 10.5pt;
  font-weight: 600;
  margin-bottom: 5px;
}


</style>
