<template>
  <div class="splash-menu-control">
    <div class="splash-menu-container">
      <div class="header">
        <img class="product" :src="product" />
        <img class="organization" v-if="organization" :src="organization" />
      </div>
      <div class="sections">
        <div class="section new-file">
          <p class="section-title">
            Create a new file...
          </p>
          <div class="section-grid">
            <div class="template" v-for="t of templates" :key="t.id" @click="$emit('new', t)">
              <h1 class="name">+ {{ t.name }}</h1>
              <p class="description">{{ t.description }}</p>
            </div>
          </div>
        </div>
        <div class="section open-file">
          <p class="section-title">
            Open an existing file...
          </p>
          <div class="section-grid">
            <div class="template" @click="$emit('open')">
              <h1 class="name">+ Open a File</h1>
              <p class="description">Open an existing file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const Images = require.context("../../assets/configuration", false);
import Configuration from "@/assets/configuration/app.config"
// Dependencies
import { DocumentTemplate } from "@/assets/scripts/Application";
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'SplashMenu',
  props: {
    templates: {
      type: Array as PropType<Array<DocumentTemplate>>,
      required: true
    }
  },
  data() {
    let organization;
    if(Configuration.branding.organization) {
      organization = Images(Configuration.branding.organization); 
    }
    return {
      product: Images(Configuration.branding.product),
      organization
    }
  },
  emits: ["new", "open"]
});
</script>

<style scoped>

/** === Main Control === */

.splash-menu-control {
  display: flex;
  align-items: center;
  min-height: 100%;
}

.splash-menu-container {
  border: solid 1px #d9d9d9;
  border-radius: 5px;
  margin: 30px 0px;
  background: #fff;
  overflow: hidden;
  box-shadow: rgb(0 0 0 / 8%) 0px 0px 10px 0px;
}

/** === Header === */

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 35px;
  border-bottom: solid 1px #d9d9d9;
  background: #f7f7f7;
  pointer-events: none;
  user-select: none;
}

.product, .organization {
  height: 50px;
}

/** === Sections === */

.sections {
  padding: 35px 35px 20px;
}

.section.new-file {
  margin-bottom: 10px;
}

.section-title {
  color: #000;
  font-size: 13pt;
  font-weight: 700;
  margin-bottom: 15px;
}

.section-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/** === Templates === */

.template {
  width: calc(50% - 7.5px);
  padding: 25px;
  border: solid 1px #d9d9d9;
  border-radius: 5px;
  border-bottom-color: #cccccc;
  margin-bottom: 15px;
  box-sizing: border-box;
  user-select: none;
}

.template:hover {
  background: #f7f7f7;
}

.template .name {
  color: #1f85cf;
  font-size: 12pt;
  font-weight: 500;
  margin: 0px 0px 8px 0px;
}

.template .description {
  color: #4c4c4c;
  font-size: 10.5pt;
  font-weight: 500;
}

</style>
