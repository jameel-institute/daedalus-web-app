<template>
  <ParameterIcon :parameter="parameter" />
  <CFormLabel :id="`${parameter.id}-label`" :for="parameter.id">
    {{ humanReadableInteger(parameter.label) }}
  </CFormLabel>
  <TooltipHelp :help-text="parameter.description" :classes="['ms-auto', 'me-3', 'mt-1']" />
</template>

<script setup lang="ts">
import { humanReadableInteger } from "~/components/utils/formatters";
import type { Parameter } from "~/types/parameterTypes";

defineProps<{
  parameter: Parameter
}>();
</script>
