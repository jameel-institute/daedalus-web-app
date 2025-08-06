<template>
  <span aria-describedby="labelDescriptor">{{ props.seriesMetadata?.label }}</span>
  <span id="labelDescriptor" class="visually-hidden">{{ props.seriesMetadata?.description }}</span>
  <TooltipHelp :help-text="props.seriesMetadata?.description" :classes="['ms-2', 'mb-1', 'smaller-icon']" />
</template>

<script setup lang="ts">
import type { DisplayInfo } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesMetadata: DisplayInfo
}>();
</script>
