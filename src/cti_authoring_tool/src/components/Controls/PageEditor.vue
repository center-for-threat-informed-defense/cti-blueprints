<template>
  <div class="page-editor-element">
    <PageEditorSection
      class="page-section"
      v-for="[key, sec] in page.sections"
      :key="key"
      :section="sec"
      @command="c => $emit('command', c)"
    />
  </div>
</template>

<script lang="ts">
// Dependencies
import { Page } from "@/assets/scripts/Page/Page";
import { defineComponent, PropType } from "vue";
// Components
import PageEditorSection from "./PageEditorSection.vue";

export default defineComponent({
  name: "PageEditor",
  props: {
    page: {
      type: Object as PropType<Page>,
      required: true
    }
  },
  emits: ["command"],
  components: { PageEditorSection }
});
</script>

<style scoped>

/** === Main Control === */

.page-section {
  margin-top: 20px;
}
.page-section:last-child {
  margin-bottom: 20px;
}

</style>