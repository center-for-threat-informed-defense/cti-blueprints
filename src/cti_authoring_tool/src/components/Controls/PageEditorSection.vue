<template>
  <div class="page-editor-section-control">
    <div class="section-name" v-if="section.name !== null">
      {{ section.name }}
    </div>
    <FieldGrid 
      class="fields"
      :rows="section.layout.rows"
      :cols="section.layout.cols"
      :properties="properties"
      @execute="c => $emit('execute', c)"
    />
  </div>
</template>

<script lang="ts">
import * as AppCommands from "@/assets/scripts/Application/Commands";
// Dependencies
import { Section, Property } from '@/assets/scripts/Page';
import { defineComponent, PropType } from 'vue';
// Components
import FieldGrid from "@/components/Controls/Fields/FieldGrid.vue";

export default defineComponent({
  name: 'PageSection',
  props: {
    section: {
      type: Object as PropType<Section>,
      required: true
    }
  },
  computed: {

    /**
     * Returns the section's properties.
     * @returns
     *  The section's properties.
     */
    properties(): Property[] {
      return [...this.section.properties.values()]
    }

  },
  emits: ["execute"],
  mounted() {
    // Execute mount command
    let cmd = AppCommands.mountSection(this.section, this.$el);
    this.$emit("execute", cmd);
  },
  unmounted() {
    // Execute destroy command
    let cmd = AppCommands.destroySection(this.section);
    this.$emit("execute", cmd);
  },
  components: { FieldGrid }
});
</script>

<style scoped>

/** === Main Control === */

.section-name {
  display: inline-block;
  color: #1f85cf;
  font-size: 13pt;
  font-weight: 400;
  padding: 8px 15px;
  border: solid 1px #dddddd;
  border-radius: 3px;
  margin-bottom: 10px;
  background: rgb(255 255 255);
}

.fields {
  border: solid 1px #d9d9d9;
  border-radius: 3px;
  background: #fff;
  padding: 30px;
}

</style>
