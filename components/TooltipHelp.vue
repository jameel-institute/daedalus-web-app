<template>
  <CTooltip
    v-if="helpText"
    :content="helpText"
    placement="top"
  >
    <template #toggler="{ togglerId, on }">
      <CIconSvg class="icon opacity-50 p-0" :class="classes">
        <img src="~/assets/icons/circleQuestion.svg" :aria-describedby="togglerId" v-on="on">
      </CIconSvg>
    </template>
  </CTooltip>
</template>

<script setup lang="ts">
import { CIconSvg } from "@coreui/icons-vue";

defineProps<{
  helpText?: string
  classes: string[]
}>();
</script>
