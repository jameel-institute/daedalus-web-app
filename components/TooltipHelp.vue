<template>
  <CTooltip
    v-if="helpText"
    placement="top"
  >
    <template #content>
      <template v-if="Array.isArray(helpText)">
        <div v-for="(text, index) in helpText" :key="index">
          {{ text }}
        </div>
      </template>
      <div v-else>
        {{ helpText }}
      </div>
    </template>
    <template #toggler="{ togglerId, on }">
      <CIconSvg
        class="icon help-icon opacity-50 p-0"
        :class="classes"
      >
        <img
          :src="`/icons/${infoIcon ? 'info' : 'circleQuestion'}.svg`"
          :aria-describedby="togglerId"
          v-on="on"
        >
      </CIconSvg>
    </template>
  </CTooltip>
</template>

<script setup lang="ts">
import { CIconSvg } from "@coreui/icons-vue";

defineProps<{
  helpText?: string | string[]
  classes: string[]
  infoIcon?: boolean
}>();

// The icon svgs are exceptionally stored in /public to facilitate a simple way of having a dynamic img src attribute:
// https://www.lichter.io/articles/nuxt3-vue3-dynamic-images/#the-public-folder-strategy
// Bear in mind that this means the image will be cached by the browser, so to update the image, you must also change
// the file name.
</script>
