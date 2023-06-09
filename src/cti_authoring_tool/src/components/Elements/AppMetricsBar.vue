<template>
  <div class="app-metrics-bar-element">
    <template v-if="propertyMetrics">
      <p class="property-metric" v-for="[k, m] of propertyMetrics" :key="k">
        {{ m.text }}: {{ m.value }}
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
// Dependencies
import { mapState } from "vuex";
import { PageEditor } from "@/assets/scripts/PageEditor";
import { defineComponent } from "vue";
import { AtomicPropertyMetrics } from "@/assets/scripts/Page/Property";

export default defineComponent({
  name: "AppMetricsBar",
  computed: {

    /**
     * Application Store data
     */
    ...mapState<any, {
      editor  : (state: Store.ApplicationStore) => PageEditor,
    }>("ApplicationStore", {
      editor(state: Store.ApplicationStore): PageEditor {
        return state.activeEditor;
      }
    }),

    /**
     * Returns the selected property's metrics.
     * @returns
     *  The selected property's metrics, `null` if no property is selected.
     */
    propertyMetrics(): AtomicPropertyMetrics | null {
      return this.editor.selected?.metrics ?? null;
    }

  }
});
</script>

<style scoped>

/** === Main Control === */

.app-metrics-bar-element {
  display: flex;
  align-items: center;
  color: #616161;
  font-size: 10.5pt;
  font-weight: 500;
  padding: 0px 15px;
}

/** === Property Metrics === */

.property-metric:first-child {
  padding: 0px;
}

.property-metric {
  padding-left: 15px;
}

</style>
