<template>
  <span aria-describedby="labelDescriptor">{{ props.seriesMetadata?.label }}</span>
  <span id="labelDescriptor" class="visually-hidden">{{ props.seriesMetadata?.description }}</span>
  <TooltipHelp :help-text="props.seriesMetadata?.description" :classes="['ms-2']" />
</template>

<script setup lang="ts">
import type { DisplayInfo } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesMetadata: DisplayInfo | undefined
}>();
</script>
