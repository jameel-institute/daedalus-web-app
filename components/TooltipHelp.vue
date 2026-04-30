<template>
  <CTooltip
    v-if="(helpText && !listHeader && !listItems) || (listHeader && listItems && !helpText)"
    placement="top"
  >
    <template #content>
      <template v-if="helpText">
        {{ helpText }}
      </template>
      <template v-else-if="listHeader && listItems">
        <div class="text-start m-2">
          {{ listHeader }}
          <ul>
            <li v-for="(text, index) in listItems" :key="index">
              {{ text }}
            </li>
          </ul>
        </div>
      </template>
    </template>
    <template #toggler="{ togglerId, on }">
      <button
        type="button"
        class="tooltip-help-trigger"
        :class="classes"
        :aria-describedby="togglerId"
        aria-label="Show help information"
        v-on="on"
        @click.stop
        @pointerdown.stop
        @touchstart.stop
      >
        <CIconSvg class="icon help-icon opacity-50 p-0">
          <img :src="`/icons/${infoIcon ? 'info.png' : 'circleQuestion.svg'}`">
        </CIconSvg>
      </button>
    </template>
  </CTooltip>
</template>

<script setup lang="ts">
import { CIconSvg } from "@coreui/icons-vue";

defineProps<{
  helpText?: string | string[]
  listHeader?: string
  listItems?: string[]
  classes: string[]
  infoIcon?: boolean
}>();

// The icon svgs are exceptionally stored in /public to facilitate a simple way of having a dynamic img src attribute:
// https://www.lichter.io/articles/nuxt3-vue3-dynamic-images/#the-public-folder-strategy
// Bear in mind that this means the image will be cached by the browser, so to update the image, you must also change
// the file name.
</script>

<style scoped>
.tooltip-help-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 0;
  vertical-align: middle;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  width: fit-content;
}

.tooltip-help-trigger::before {
  content: "";
  position: absolute;
  inset: -0.5rem;
}
</style>
