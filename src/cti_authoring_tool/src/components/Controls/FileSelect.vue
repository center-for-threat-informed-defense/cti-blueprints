<template>
  <div class="app-file-select-element">
    <div 
      v-for="[k, e] of editors" :key="k" 
      :class="['file', { active: k === this.active }]"
      @click="$emit('switch', k)"
    >
      <File class="file-icon" />
      <p class="file-title">{{ e.name }}</p>
      <p class="file-close" @click.stop="$emit('close', k)">✗</p>
    </div>
  </div>
</template>

<script lang="ts">
// Dependencies
import { PageEditor } from "@/assets/scripts/PageEditor/PageEditor";
import { defineComponent, PropType } from "vue";
// Components
import File from "@/components/Icons/File.vue";

export default defineComponent({
  name: "FileSelect",
  props: {
    active: {
      type: String,
      required: true
    },
    editors: {
      type: Object as PropType<Map<string, PageEditor>>,
      required: true
    }
  },
  emits: ["switch", "close"],
  components: { File }
});
</script>

<style scoped>

/** === Main Control === */

.app-file-select-element {
  display: flex;
  background: #f2f2f2;
}

.app-file-select-element::after {
  content: "";
  flex: 1;
  border-top: solid 1px #bfbfbf;
}

/** === File === */

.file {
  display: flex;
  align-items: center;
  color: #000000;
  padding: 8px 12px;
  border-top: solid 1px #bfbfbf;
  border-right: solid 1px #bfbfbf;
  box-sizing: border-box;
  user-select: none;
  cursor: pointer;
}

.file:not(.active):hover {
  background: #0000000a;
}

.file.active {
  border-top: solid 2px #2c74ea;
}

.file.active .file-title {
  font-weight: 600;
}

.file-title {
  flex: 1;
  max-width: 180px;  
  font-size: 10pt;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0px 12px;
  overflow: hidden;
}

.file-close {
  color: #666666;
}

.file-close:hover {
  color: #000000;
  font-weight: 600;
}

</style>
