<template>
  <div :class="['options-list-field-control', alignment, { flip }]">
    <ScrollBox :top="scrollTop" :style="style" :propagateScroll="false">
      <ul class="options" v-if="hasOptions">
        <li 
          ref="items"
          v-for="option in options"
          :key="option.value"
          :list-id="option.value"
          :class="{ active: isActive(option), null: isNull(option) }"
          @click="$emit('select', option.value)"
          @mouseenter="active = option.value"
          exit-focus-box
        >
          {{ option.text }}
        </li>
      </ul>
      <div class="no-options" v-if="!hasOptions">
        No matches
      </div> 
    </ScrollBox>
  </div>
</template>

<script lang="ts">
// Dependencies
import { Alignment } from "@/assets/scripts/Page";
import { defineComponent, PropType, ref } from "vue";
// Components
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: "EnumField",
  props: {
    maxHeight: {
      type: Number,
      required: true
    },
    options: {
      type: Array as PropType<{ value: string | null, text: string }[]>,
      required: true
    },
    select: {
      type: String
    },
    align: {
      type: Number
    },
  },
  data() {
    return {
      flip: false,
      active: this.select,
      scrollTop: 0
    }
  },
  computed: {

    /**
     * Returns the field's alignment classes.
     * @returns
     *  The field's alignment classes.
     */
    alignment(): string {
      switch(this.align) {
        case Alignment.TopLeft:
        case Alignment.MiddleLeft:
        case Alignment.BottomLeft:
        default:
          return "align-left";
        case Alignment.TopCenter:
        case Alignment.MiddleCenter:
        case Alignment.BottomCenter:
          return "align-center";
        case Alignment.TopRight:
        case Alignment.MiddleRight:
        case Alignment.BottomRight:
          return "align-right";
      }
    },

    /**
     * Returns the option list's style.
     * @returns
     *  The option list's style.
     */
    style(): { maxHeight: string } {
      return { maxHeight: `${ this.maxHeight }px` };
    },

    /**
     * Tests if there are any options available.
     * @returns
     *  True if there are options available, false otherwise.
     */
    hasOptions() {
      return 0 < this.options.length;
    }

  },
  emits: ["select"],
  methods: {

    /**
     * Tests if an option is the null option.
     * @returns
     *  True if the options is the null option, false otherwise.
     */
    isNull(option: { value: string | null, text: string }) {
      return option.value === null
    },

    /**
     * Tests if an option is active.
     * @returns
     *  True if the option is active, false otherwise.
     */
    isActive(option: { value: string | null, text: string }) {
      return this.active === option.value;
    },

    /**
     * Moves the focus to the currently active item.
     */
    focusActive() {
      // Resolve active item
      let item: HTMLElement | undefined;
      for(let el of this.$refs.items as HTMLElement[]) {
        if(this.select === el.getAttribute("list-id")) {
          item = el as HTMLElement;
          break;
        }
      }
      // Update scroll position
      if(item) {
        // -6px for the <ul>'s padding
        this.scrollTop = item.offsetTop - 6;
      }
    }

  },
  watch: {
    // On select change
    select() {
      // Update active item
      this.active = this.select;
      // Focus the active item
      this.focusActive();
    },
    // On options change
    options() {
      // Focus the active item
      this.$nextTick(() => {
        this.focusActive();
      });
    }
  },
  mounted() {

    /**
     * Developer's Note:
     * If an <OptionsList> does not extend past the bottom of the document's
     * body or it's parent <ScrollBox>, it's deemed visible. These checks do
     * not account for any other scroll constructs and do not account for
     * nested <ScrollBox>'s. 
     */
    
    // Resolve parent
    let sc = "scroll-content";
    let ele = this.$el;
    let par = this.$el.parentElement;
    let body = document.body;
    while(par !== body && !par.classList.contains(sc)) {
      par = par.parentElement;
    }
    // Resolve overlap
    let { bottom: b1 } = par.getBoundingClientRect();
    let { bottom: b2 } = ele.getBoundingClientRect();
    if(b1 < b2) {
      this.flip = true;
    } else {
      this.flip = false;
    }
    // Focus the active item
    this.focusActive();
  },
  components: { ScrollBox }
});
</script>

<style scoped>

/** === Main Field === */

.options-list-field-control {
  position: absolute;
  left: -1px;
  width: calc(100% + 2px);
  border-width: 1px;
  border-color: #d9d9d9;
  border-bottom: solid 1px #cccccc;
  box-sizing: border-box;
  background: #ededed;
  z-index: 1;
}

.options-list-field-control:not(.flip) {
  top: calc(100% - 2px);
  border-style: none solid solid solid;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.options-list-field-control:not(.flip)::before {
  content: "";
  display: block;
  width: 100%;
  height: 2px;
  background: #fff;
}

.options-list-field-control.flip {
  bottom: calc(100% - 2px);
  border-style: solid solid none solid;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.options-list-field-control.flip::after {
  content: "";
  display: block;
  width: 100%;
  height: 2px;
  background: #fff;
}

/** === Scrollbox === */

.options-list-field-control:not(.flip) .scrollbox-container {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  box-shadow: 0px 5px 5px -2px rgb(0 0 0 / 20%);
}

.options-list-field-control.flip .scrollbox-container {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  box-shadow: 0px -5px 5px -2px rgb(0 0 0 / 20%);
}

/** === Options List === */

.options {
  position: relative;
  padding: 6px 5px;
}

.options li {
  list-style: none;
  font-size: 10pt;
  user-select: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 5px 12px;
  overflow: hidden;
}

.options li.active,
.options li.active.null {
  color: #fff;
  background: #1f85cf;
}

.options li.null {
  color: #6a6a6a;
}

.no-options {
  color: #4e4e4e;
  user-select: none;
  padding: 8px 12px;
}

.align-left .options li,
.align-left .no-options {
  text-align: left;
}
.align-center .options li,
.align-center .no-options {
  text-align: center;
}
.align-right .options li,
.align-right .no-options  {
  text-align: right;
}

/** === Scroll Box === */

.options-list-field-control:not(.flip):deep(.scroll-content) {
  border-top: solid 1px #d9d9d9;  
}

.options-list-field-control.flip:deep(.scroll-content) {
  border-bottom: solid 1px #d9d9d9;  
}

.options-list-field-control:deep(.scroll-bar) {
  border-left: solid 1px #d9d9d9;  
}

</style>
