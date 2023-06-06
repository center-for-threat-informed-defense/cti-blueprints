<template>
  <div class="field-grid-control" :style="grid">
    <template v-for="prop in properties" :key="prop.id">
      <div class="field-info" :style="propTitleGridStyle(prop)">
        <p class="field-name">{{ prop.name }}</p>
        <a class="field-help" :href="prop.help" v-if="prop.help" target=”_blank”></a>
      </div>
      <component
        class="field-value"
        :style="propFieldGridStyle(prop)"
        :is="getField(prop)"
        :property="prop"
        @execute="c => $emit('execute', c)"
      />
    </template>
  </div> 
</template>

<script lang="ts">
// Dependencies
import { Property } from '@/assets/scripts/Page/Property/Property';
import { defineComponent, PropType } from 'vue';
// Components
import TextField from "./TextField.vue";
import EnumField from "./EnumField.vue";
import NumberField from "./NumberField.vue";
import DateTimeField from "./DateTimeField.vue";
import BasicTableField from "./BasicTableField.vue";
import ComplexTableField from "./ComplexTableField.vue";
import { 
    BasicTableProperty, ComplexTableProperty, DateProperty, 
    DateTimeProperty, EnumProperty, FloatProperty, 
    IntegerProperty, StringProperty, TimeProperty
} from '@/assets/scripts/Page';

export default defineComponent({
  name: 'FieldGrid',
  props: {
    rows: {
      type: Number,
      required: true
    },
    cols: {
      type: Number,
      required: true
    },
    properties: {
      type: Array as PropType<Property[]>,
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
        gridTemplateRows: new Array(this.rows).fill("22px auto").join(" 18px "),
        gridTemplateColumns: `repeat(${ this.cols }, minmax(0, 1fr))`,
      }
    }

  },
  emits: ["execute"],
  methods: {
    
    /**
     * Returns a property title's grid styling.
     * @returns
     *  The property title's grid styling.
     */
    propTitleGridStyle(property: Property) {
      let { row, col } = property;
      let r = Array.isArray(row) ? {
        gridRowStart    : (3 * row[0]) - 2
      } : {
        gridRowStart    : (3 * row) - 2
      }
      let c = Array.isArray(col) ? {
        gridColumnStart : col[0],
        gridColumnEnd   : col[1] + 1
      } : {
        gridColumnStart : col
      }
      return { ...r, ...c }
    },

    /**
     * Returns a property field's grid styling.
     * @returns
     *  The property field's grid styling.
     */
    propFieldGridStyle(property: Property) {
      let { row, col } = property;
      let r = Array.isArray(row) ? {
        gridRowStart    : (3 * row[0]) - 1,
        gridRowEnd      : (3 * row[1])
      } : {
        gridRowStart    : (3 * row) - 1
      }
      let c = Array.isArray(col) ? {
        gridColumnStart : col[0],
        gridColumnEnd   : col[1] + 1
      } : {
        gridColumnStart : col
      }
      return { ...r, ...c }
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
        case BasicTableProperty.name:
          return "BasicTableField";
        case ComplexTableProperty.name:
          return "ComplexTableField";
      }
    }

  },
  components: { 
    TextField, EnumField, NumberField, DateTimeField,
    BasicTableField, ComplexTableField
  }
});
</script>

<style scoped>

/** === Main Control === */

.field-grid-control {
  display: grid;
  column-gap: 15px;
}

.field-info {
  display: flex;
  align-items: center;
  color: #616161;
  font-size: 10.5pt;
  font-weight: 600;
  margin-bottom: 5px;
}

.field-name {
  flex: 1;
}

.field-help {
  font-size: 8pt;
}

.field-value {
  background: #fff;
}

</style>
