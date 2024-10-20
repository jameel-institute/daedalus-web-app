<template>
  <ParameterIcon :parameter="parameter" />
  <CFormLabel :id="`${parameter.id}-label`" :for="parameter.id">
    {{ parameter.label }}
  </CFormLabel>
  <TooltipHelp :help-text="parameter.description" :classes="['ms-auto', 'me-3', 'mt-1']" />
</template>

<script setup lang="ts">
import type { Parameter } from "~/types/parameterTypes";

defineProps<{
  parameter: Parameter
}>();
</script>

<style scoped lang="scss">

</style>
