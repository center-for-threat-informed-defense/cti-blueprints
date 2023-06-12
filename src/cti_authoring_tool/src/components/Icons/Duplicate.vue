<template>
  <svg width="13" height="13" version="1.1" viewBox="0 0 3.4396 3.4396" xmlns="http://www.w3.org/2000/svg" :fill="color">
    <path d="m0 0v2.6458h0.52917v-2.1167h2.1167v-0.52917h-2.1167zm0.79272 0.79272v2.6469h2.6469v-2.6469zm0.52968 0.52968h1.5875v1.5875h-1.5875z"/>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
  name: "Duplicate",
  props: {
    color: {
      type: String,
      default: "#808080"
    }
  }
});
</script>
