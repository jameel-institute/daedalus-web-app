<template>
  <ParameterIcon :parameter="parameter" />
  <CFormLabel :for="parameter.id">
    {{ parameter.label }}
  </CFormLabel>
  <TooltipHelp :help-text="parameter.description" />
</template>

<script setup lang="ts">
import type { Parameter } from "~/types/parameterTypes";

defineProps<{
  parameter: Parameter
}>();
</script>

<style scoped lang="scss">

</style>
