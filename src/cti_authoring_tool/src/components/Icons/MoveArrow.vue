<template>
  <svg width="9" height="15" version="1.1" viewBox="0 0 2.3812 3.9688" xmlns="http://www.w3.org/2000/svg" :fill="color">
    <path transform="matrix(.30441 0 0 .19528 -4.0986 -9.6401)" d="m17.375 49.366-3.9113 6.7745h2.6075v6.7745h-2.6075l3.9113 6.7745 3.9113-6.7745h-2.6075v-6.7745h2.6075z" stroke-width="1.0852"/>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
  name: "MoveArrow",
  props: {
    color: {
      type: String,
      default: "#808080"
    }
  }
});
</script>
