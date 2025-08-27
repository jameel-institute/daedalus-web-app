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
      <CIconSvg
        class="icon help-icon opacity-50 p-0"
        :class="[...classes, infoIcon ? 'info-icon' : 'question-icon']"
      >
        <img
          :src="`/icons/${infoIcon ? 'info.png' : 'circleQuestion.svg'}`"
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

<style lang="scss" scoped>
.icon:not(.icon-c-s):not(.icon-custom-size).info-icon {
  width: 0.8rem;
  height: 0.8rem;
  margin-bottom: 0.1rem;
}
</style>
