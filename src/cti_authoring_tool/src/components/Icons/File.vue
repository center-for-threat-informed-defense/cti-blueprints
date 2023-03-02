<template>
  <svg width="10" height="12" version="1.1" viewBox="0 0 2.6458 3.175" xmlns="http://www.w3.org/2000/svg" :fill="color">
    <path d="m0 0v3.176h2.6464v-2.1193l-1.0563-1.0568zm0.26355 0.26355h1.0594v1.0594h1.0578v1.587h-2.1172zm1.324 0.10697 0.68626 0.68781h-0.68626z"/>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
  name: "File",
  props: {
    color: {
      type: String,
      default: "#666666"
    }
  }
});
</script>
