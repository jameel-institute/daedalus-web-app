<template>
  <div class="d-flex numeric-header">
    <ParameterHeader :parameter="props.parameter" />
  </div>
  <div class="d-flex flex-wrap">
    <div class="flex-grow-1" :class="[warn && !invalid ? 'has-warning' : '']">
      <CFormInput
        :id="props.parameter.id"
        v-model="parameterValue"
        :aria-label="props.parameter.label"
        type="number"
        :class="[props.pulsing ? 'pulse' : '']"
        :min="range?.min"
        :max="range?.max"
        :step="props.parameter.step"
        :size="appStore.largeScreen ? 'lg' : undefined"
        :feedback-invalid="tooltipText"
        :data-valid="!invalid"
        :invalid="showTooltip"
        :tooltip-feedback="true"
        @change="handleChange"
        @input="handleInput"
      />
      <CFormRange
        :id="props.parameter.id"
        v-model="parameterValue"
        :aria-label="props.parameter.label"
        :step="props.parameter.step"
        :min="range?.min"
        :max="range?.max"
        @change="handleChange"
      />
    </div>
    <CButton
      style="border: none;"
      type="button"
      color="secondary"
      variant="ghost"
      shape="rounded-pill"
      :class="`${parameterValue === defaultValue ? 'invisible' : ''} btn-sm ms-2 align-self-start`"
      :aria-label="`Reset ${props.parameter.label} to default`"
      title="Reset to default"
      @click="parameterValue = defaultValue"
    >
      <CIcon icon="cilActionUndo" size="sm" />
    </CButton>
  </div>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

import { type Parameter, type ParameterSet, TypeOfParameter } from "@/types/parameterTypes";
// TODO: I'd like to refactor those utils into composables, to reduce the amount of data that needs to be passed around into the utils
import { numericValueInvalid, numericValueIsOutOfRange } from "~/components/utils/validations";
import { debounce } from "perfect-debounce";
import { getRangeForDependentParam } from "~/components/utils/parameters";

const props = defineProps<{
  parameter: Parameter
  parameterSet: ParameterSet
  pulsing: boolean
  showValidations: boolean
}>();

const emit = defineEmits(["change"]);

const parameterValue = defineModel("parameterValue", { type: String });

const appStore = useAppStore();

const showWarnings = ref(false); // Show warning tooltip if there is any warning to show

const handleChange = () => {
  showWarnings.value = true;
  emit("change");
};

const handleInput = () => {
  // Stop showing warnings while the user is typing
  showWarnings.value = false;

  debounce(() => {
    showWarnings.value = true;
  }, 500)();
};

const range = computed(() => {
  return getRangeForDependentParam(props.parameter, props.parameterSet);
});

// NB: Currently, due to the metadata schema, non-updatable numerics don't have default values available.
const defaultValue = computed(() => range.value?.default.toString() || "");

const invalid = computed(() => {
  return (!parameterValue.value || numericValueInvalid(parameterValue.value, props.parameter));
});

const warn = computed(() => {
  return numericValueIsOutOfRange(parameterValue.value, props.parameter, props.parameterSet);
});

const showTooltip = computed(() => !!(warn.value && showWarnings.value) || !!(invalid.value && props.showValidations));

const tooltipText = computed(() => {
  if (props.parameter.parameterType === TypeOfParameter.Numeric && invalid.value) {
    return "Field cannot be empty or negative.";
  } else if (props.parameter.updateNumericFrom && warn.value && !invalid.value) {
    const dependedUponParam = appStore.parametersMetadataById[props.parameter.updateNumericFrom!.parameterId];

    if (dependedUponParam) {
      const selectedOption = dependedUponParam.options?.find((o) => {
        return o.id === (props.parameterSet ?? {})[props.parameter.updateNumericFrom?.parameterId || ""];
      });
      return `NB: This value is outside the estimated range for ${selectedOption?.label} (${range.value?.min}–${range.value?.max}).`
        + ` Proceed with caution.`;
    }
  }
  return "This field is required.";
});
</script>

<style scoped lang="scss">
:deep(.has-warning input[type=range].form-range) {
  &::-webkit-slider-thumb {
    background-color: $warning;
  }

  &::-moz-range-thumb {
    background-color: $warning;
  }

  &::-ms-thumb {
    background-color: $warning;
  }
}
</style>
