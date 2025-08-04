<template>
  <CRow>
    <ParameterHeader :parameter="parameter" />
    <VueSelect
      v-model="parameterValue"
      :input-id="props.parameter.id"
      :aria="{ labelledby: `${props.parameter.id}-label`, required: true }"
      :class="`form-control ${props.pulsing ? 'pulse' : ''}`"
      :options="paramOptsToSelectOpts(props.parameter.options || [])"
      :is-clearable="false"
      @option-selected="$emit('change')"
    >
      <template #value="{ option }">
        <div class="d-flex gap-2 align-items-center">
          <span
            v-if="props.parameter === appStore.globeParameter && countryFlagIds?.[option.value]"
            :class="`fi fi-${countryFlagIds[option.value]}`"
          />
          {{ option.label }}
        </div>
      </template>
      <template #option="{ option }">
        <div class="parameter-option">
          <span
            v-if="props.parameter === appStore.globeParameter && countryFlagIds?.[option.value]"
            :class="`fi fi-${countryFlagIds[option.value]} ms-1`"
          />
          <span>{{ option.label }}</span>
          <div
            v-if="option.description"
            :class="option.value === parameterValue ? 'text-dark' : 'text-muted'"
          >
            <small>{{ option.description }}</small>
          </div>
        </div>
      </template>
    </VueSelect>
  </CRow>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { countryFlagIconId } from "~/components/utils/countryFlag";

import { paramOptsToSelectOpts } from "~/components/utils/parameters";
import type { Parameter } from "@/types/parameterTypes";

const props = defineProps<{
  parameter: Parameter
  pulsing: boolean
}>();

defineEmits(["change"]);

const parameterValue = defineModel("parameterValue", { type: String, required: true });

const appStore = useAppStore();

const countryFlagIds = computed(() => {
  return appStore.globeParameter?.options?.reduce((acc, option) => {
    acc[option.id] = countryFlagIconId(option.id) || "";
    return acc;
  }, {} as { [key: string]: string });
});
</script>
