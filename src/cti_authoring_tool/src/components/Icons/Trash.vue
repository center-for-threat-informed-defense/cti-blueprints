<template>
  <svg width="11" height="15" version="1.1" viewBox="0 0 2.9104 3.9688" xmlns="http://www.w3.org/2000/svg" :fill="color">
    <path d="m1.0583 0v0.26458h0.79375v-0.26458zm-1.0583 0.52917v0.52917h2.9104v-0.52917zm0.26458 0.79375v2.6458h2.3812v-2.6458zm0.52917 0.52917h0.26458v1.5875h-0.26458zm0.52917 0h0.26458v1.5875h-0.26458zm0.52917 0h0.26458v1.5875h-0.26458z"/>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
  name: "Trash",
  props: {
    color: {
      type: String,
      default: "#808080"
    }
  }
});
</script>
