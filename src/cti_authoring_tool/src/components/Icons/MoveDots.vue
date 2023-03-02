<template>
  <svg width="11" height="6" version="1.1" viewBox="0 0 2.9104 1.5875" xmlns="http://www.w3.org/2000/svg" :fill="color">
    <path d="m0 0v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917zm-2.3812 1.0583v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917zm0.79375 0v0.52917h0.52917v-0.52917z" stroke-width=".26458"/>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
  name: "MoveDots",
  props: {
    color: {
      type: String,
      default: "#808080"
    }
  }
});
</script>
