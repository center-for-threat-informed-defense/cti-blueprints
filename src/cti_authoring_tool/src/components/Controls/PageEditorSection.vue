<template>
  <FieldGrid 
    class="page-editor-section-control"
    :rows="section.layout.rows"
    :cols="section.layout.cols"
    :properties="properties"
    @command="c => $emit('command', c)"
  />
</template>

<script lang="ts">
import * as App from "@/assets/scripts/Commands/AppCommands";
// Dependencies
import { Property } from '@/assets/scripts/Page/Property';
import { PageSection } from '@/assets/scripts/Page/PageSection';
import { defineComponent, PropType } from 'vue';
// Components
import FieldGrid from "@/components/Controls/Fields/FieldGrid.vue";

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
     * Returns the section's properties.
     * @returns
     *  The section's properties.
     */
    properties(): Property[] {
      return [...this.section.properties.values()]
    }

  },
  emits: ["command"],
  mounted() {
    // Execute mount command
    this.$emit("command", new App.MountPageSection(this.section, this.$el))
  },
  unmounted() {
    // Execute destroy command
    this.$emit("command", new App.DestroyPageSection(this.section));
  },
  components: { FieldGrid }
});
</script>

<style scoped>

/** === Main Control === */

.page-editor-section-control {
  padding: 30px;
  border: solid 1px #d9d9d9;
  border-radius: 3px;
  background: #fff;
}

</style>
