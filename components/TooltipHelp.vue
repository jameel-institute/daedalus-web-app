<template>
  <!-- <CTooltip
    v-if="helpText"
    :content="helpText"
    placement="top"
  >
    <template #toggler="{ togglerId, on }"> -->
  <CIconSvg class="icon opacity-50 ms-2">
    <!-- <img src="~/assets/icons/circleQuestion.svg" :aria-describedby="togglerId" v-on="on"> -->
    <img src="~/assets/icons/circleQuestion.svg">
  </CIconSvg>
  <!-- </template>
  </CTooltip> -->
</template>

<script setup lang="ts">
import { CIconSvg } from "@coreui/icons-vue";

defineProps<{
  helpText?: string
}>();
</script>
