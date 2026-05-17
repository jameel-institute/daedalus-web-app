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
        <div class="d-flex gap-2 align-items-center parameter-option">
          <span
            v-if="props.parameter === appStore.globeParameter"
            :class="countryFlagClass(option.value)"
          />
          {{ option.label }}
          <span v-if="optionTag(option)" :class="`pathogenTag ${optionTag(option)}`" style="padding-top: 0.3rem;">{{ optionTag(option) }}</span>
        </div>
      </template>
      <template #option="{ option }">
        <div class="parameter-option">
          <div class="d-flex gap-2 align-items-center">
            <span
              v-if="props.parameter === appStore.globeParameter"
              :class="countryFlagClass(option.value)"
            />
            {{ option.label }}
            <span v-if="optionTag(option)" :class="`pathogenTag ${optionTag(option)}`" style="margin-left: auto;">{{ optionTag(option) }}</span>
          </div>
          <div
            v-if="option.description"
            :class="option.value === parameterValue ? 'text-dark' : 'text-muted'"
          >
            <p class="text-xs mb-0 ms-1">
              {{ option.description }}
            </p>
          </div>
        </div>
      </template>
    </VueSelect>
  </CRow>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { countryFlagClass } from "~/components/utils/countryFlag";

import { type ParameterSelectOption, paramOptsToSelectOpts, pathogenOptionTag } from "~/components/utils/parameters";
import type { Parameter } from "@/types/parameterTypes";

const props = defineProps<{
  parameter: Parameter
  pulsing: boolean
}>();

defineEmits(["change"]);

const parameterValue = defineModel("parameterValue", { type: String, required: true });

const appStore = useAppStore();

const optionTag = (option: ParameterSelectOption) => pathogenOptionTag(props.parameter.id, option.value);
</script>

<style lang="scss" scoped>
.parameter-option {
  .pathogenTag {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    padding: 0.1rem 0.4rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
    height: 1.2rem;

    &.influenza {
      background-color: var(--cui-info-bg-subtle);
      color: var(--cui-info-text-emphasis);
    }

    &.SARS-CoV {
      background-color: var(--cui-warning-bg-subtle);
      color: var(--cui-warning-text-emphasis);
    }
  }
}
</style>
