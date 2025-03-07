<template>
  <ParameterIcon v-if="!hideIcon" :parameter="parameter" />
  <CFormLabel :id="`${parameter.id}-label`" :for="parameter.id">
    {{ parameter.label }}
  </CFormLabel>
  <TooltipHelp :help-text="parameter.description" :classes="['ms-auto', 'me-3', 'mt-1', 'smaller-icon']" />
</template>

<script setup lang="ts">
import type { Parameter } from "~/types/parameterTypes";

defineProps<{
  parameter: Parameter
  hideIcon?: boolean
}>();
</script>
