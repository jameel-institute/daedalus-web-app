<template>
  <div>
    <CForm
      v-if="paramMetadata && formData && appStore.metadataFetchStatus !== 'error'"
      v-show="mounted"
      class="inputs"
      role="form"
      novalidate
      @submit.prevent="submitForm"
    >
      <div
        v-for="(parameter) in paramMetadata"
        :key="parameter.id"
        class="field-container"
      >
        <div v-if="renderAsRadios(parameter)" class="button-group-container">
          <CRow class="pe-2">
            <ParameterHeader :parameter="parameter" />
          </CRow>
          <CRow>
            <CButtonGroup
              role="group"
              :aria-label="parameter.label"
              :size="appStore.largeScreen ? 'lg' : undefined"
              :class="`${pulsingParameters.includes(parameter.id) ? 'pulse' : ''}`"
              @change="handleChange(parameter)"
            >
              <CTooltip
                v-for="(option) in parameter.options"
                :key="option.id"
                :content="option.description"
                placement="top"
                :delay="100"
              >
                <template #toggler="{ togglerId, on }">
                  <div
                    class="radio-btn-container"
                    :aria-describedby="togglerId"
                    v-on="on"
                  >
                    <CFormCheck
                      :id="option.id"
                      v-model="formData[parameter.id]"
                      type="radio"
                      :button="{ color: 'primary', variant: 'outline' }"
                      :name="parameter.id"
                      autocomplete="off"
                      :label="option.label"
                      :value="option.id"
                    />
                  </div>
                </template>
              </CTooltip>
            </CButtonGroup>
          </CRow>
        </div>
        <div v-else-if="renderAsSelect(parameter)" class="select-container">
          <CRow>
            <ParameterHeader :parameter="parameter" />
            <VueSelect
              v-model="formData![parameter.id]"
              :input-id="parameter.id"
              :aria="{ labelledby: `${parameter.id}-label`, required: true }"
              :class="`form-control ${pulsingParameters.includes(parameter.id) ? 'pulse' : ''}`"
              :options="paramOptsToSelectOpts(parameter.options || [])"
              :is-clearable="false"
              @option-selected="handleChange(parameter)"
            >
              <template #value="{ option }">
                <div class="d-flex gap-2 align-items-center">
                  <span
                    v-if="parameter === appStore.globeParameter && countryFlagIds?.[option.value]"
                    :class="`fi fi-${countryFlagIds[option.value]}`"
                  />
                  {{ option.label }}
                </div>
              </template>
              <template #option="{ option }">
                <div class="parameter-option">
                  <span
                    v-if="parameter === appStore.globeParameter && countryFlagIds?.[option.value]"
                    :class="`fi fi-${countryFlagIds[option.value]} ms-1`"
                  />
                  <span>{{ option.label }}</span>
                  <div
                    v-if="option.description"
                    :class="option.value === formData[parameter.id] ? 'text-dark' : 'text-muted'"
                  >
                    <small>{{ option.description }}</small>
                  </div>
                </div>
              </template>
            </VueSelect>
          </CRow>
        </div>
        <div v-else-if="parameter.parameterType === TypeOfParameter.Numeric">
          <div class="d-flex numeric-header">
            <ParameterHeader :parameter="parameter" />
          </div>
          <div class="d-flex flex-wrap">
            <div class="flex-grow-1" :class="[warnButNotInvalid(parameter) ? 'has-warning' : '']">
              <CFormInput
                :id="parameter.id"
                v-model="formData[parameter.id]"
                :aria-label="parameter.label"
                type="number"
                :class="[
                  pulsingParameters.includes(parameter.id) ? 'pulse' : '',
                ]"
                :min="dependentRange(parameter)?.min"
                :max="dependentRange(parameter)?.max"
                :step="parameter.step"
                :size="appStore.largeScreen ? 'lg' : undefined"
                :feedback-invalid="tooltipText(parameter)"
                :data-valid="!invalidFields?.includes(parameter.id)"
                :invalid="showTooltip(parameter)"
                :tooltip-feedback="true"
                @change="handleChange(parameter)"
                @input="handleInput"
              />
              <CFormRange
                :id="parameter.id"
                v-model="formData[parameter.id]"
                :aria-label="parameter.label"
                :step="parameter.step"
                :min="dependentRange(parameter)?.min"
                :max="dependentRange(parameter)?.max"
                @change="handleChange(parameter)"
              />
            </div>
            <CButton
              style="border: none;"
              type="button"
              color="secondary"
              variant="ghost"
              shape="rounded-pill"
              :class="`${valueIsAtDefault(parameter) ? 'invisible' : ''} btn-sm ms-2 align-self-start`"
              :aria-label="`Reset ${parameter.label} to default`"
              title="Reset to default"
              @click="resetParam(parameter)"
            >
              <CIcon icon="cilActionUndo" size="sm" />
            </CButton>
          </div>
        </div>
      </div>
      <CButton
        id="run-button"
        color="primary"
        :size="appStore.largeScreen ? 'lg' : undefined"
        type="submit"
        :disabled="runButtonDisabled"
        class="ms-auto align-self-start"
        @click="submitForm"
      >
        Run
        <CSpinner v-if="formSubmitting && appStore.metadataFetchStatus !== 'error'" size="sm" class="ms-1" />
        <CIcon v-else icon="cilArrowRight" />
      </CButton>
    </CForm>
    <CAlert v-else-if="!appStore.metadata && appStore.metadataFetchStatus === 'error'" color="warning">
      Failed to initialise. {{ appStore.metadataFetchError }}
    </CAlert>
    <CSpinner v-show="(!appStore.metadata && appStore.metadataFetchStatus !== 'error') || !mounted" />
  </div>
</template>

<script lang="ts" setup>
import { debounce } from "perfect-debounce";
import type { Parameter, ParameterSet } from "@/types/parameterTypes";
import { TypeOfParameter } from "@/types/parameterTypes";
import { CIcon } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";
import ParameterHeader from "~/components/ParameterHeader.vue";
import { getRangeForDependentParam, paramOptsToSelectOpts } from "~/components/utils/parameters";
import { numericValueInvalid, numericValueIsOutOfRange } from "~/components/utils/validations";
import { countryFlagIconId } from "~/components/utils/countryFlag";

const props = defineProps<{
  inModal: boolean
}>();

const appStore = useAppStore();

const formSubmitting = ref(false);
const showValidations = ref(false);
const showWarnings = ref(false); // Show warning tooltip if there is any warning to show
const mounted = ref(false);
const invalidFields = ref<string[]>([]);

const paramMetadata = computed(() => appStore.metadata?.parameters);

const countryFlagIds = computed(() => {
  return appStore.globeParameter?.options?.reduce((acc, option) => {
    acc[option.id] = countryFlagIconId(option.id) || "";
    return acc;
  }, {} as { [key: string]: string });
});

const initialiseFormDataFromDefaults = () => {
  return paramMetadata.value?.reduce((acc, { id, defaultOption, options, updateNumericFrom }) => {
    if (options && !updateNumericFrom) { // Excludes fields whose values depend on others'; we'll set these once all the defaults are set.
      acc[id] = (defaultOption || options[0].id).toString();
    }
    return acc;
  }, {} as ParameterSet);
};

const formData = ref(
  // Initialize formData as a dictionary of parameters with values set to defaults if available,
  // or to the previous scenario's values if any.
  appStore.currentScenario.parameters ? { ...appStore.currentScenario.parameters } : initialiseFormDataFromDefaults(),
);

const pulsingParameters = ref([] as string[]);
// An object mapping the dependency relationship between parameters' metadata, where keys are the ids of parameters that are depended upon,
// and values are lists (usually single-element) of the parameters whose metadata (e.g. estimated range) has a dependency on them.
const parameterDependencies = computed((): Record<string, string[]> => {
  const deps = {} as { [key: string]: Array<string> };
  paramMetadata.value?.forEach((param) => {
    if (param.updateNumericFrom) {
      const dependedOn = param.updateNumericFrom.parameterId;
      if (!deps[dependedOn]) {
        deps[dependedOn] = [];
      }
      deps[dependedOn].push(param.id);
    }
  });
  return deps;
});

const runButtonDisabled = computed(() => {
  if (!formData.value || formSubmitting.value || appStore.metadataFetchStatus === "error") {
    return true;
  } else if (props.inModal && appStore.currentScenario.parameters) {
    const parametersHaveChanged = Object.keys(formData.value).some((key) => {
      return formData.value![key] !== appStore.currentScenario.parameters![key];
    });
    return !parametersHaveChanged; // Only enable the run button if there has been a change to the parameters in the form
  } else {
    return false;
  }
});

const warningFields = computed(() => {
  return paramMetadata.value?.filter(p => numericValueIsOutOfRange(formData.value?.[p.id], p, formData.value)).map(p => p.id);
});

const warnButNotInvalid = (param: Parameter) => {
  return warningFields.value?.includes(param.id) && !invalidFields.value?.includes(param.id);
};

const optionsAreTerse = (param: Parameter) => {
  const eachOptionIsASingleWord = param.options?.every((option) => {
    return !option.label.includes(" ");
  });

  return param.options && param.options.length <= 5 && eachOptionIsASingleWord;
};

const renderAsRadios = (param: Parameter) => {
  return param.parameterType === TypeOfParameter.Select && optionsAreTerse(param);
};

const renderAsSelect = (param: Parameter) => {
  return !renderAsRadios(param) && [TypeOfParameter.Select, TypeOfParameter.GlobeSelect].includes(param.parameterType);
};

const dependentRange = (param: Parameter) => {
  return getRangeForDependentParam(param, formData.value);
};

const showTooltip = (param: Parameter) => !!(warningFields.value?.includes(param.id) && showWarnings.value)
  || !!(invalidFields.value?.includes(param.id) && showValidations.value);

// Since some defaults depend on the values of other fields, this function should not be used to initialize form values.
const defaultValue = (param: Parameter) => {
  if (!formData.value) {
    return;
  }

  if (param.updateNumericFrom) {
    return getRangeForDependentParam(param, formData.value)?.default.toString();
  } else if (param.parameterType === TypeOfParameter.Select || param.parameterType === TypeOfParameter.GlobeSelect) {
    return param.defaultOption || param.options?.[0]?.id;
  }
  // Currently, due to the metadata schema, non-updatable numerics don't have default values available.
};

const valueIsAtDefault = (param: Parameter) => {
  return formData.value![param.id] === defaultValue(param);
};

const resetParam = (param: Parameter) => {
  formData.value![param.id] = defaultValue(param) as string;
};

const tooltipText = (param: Parameter) => {
  if (param.parameterType === TypeOfParameter.Numeric && invalidFields.value?.includes(param.id)) {
    return "Field cannot be empty or negative.";
  } else if (param.updateNumericFrom && warningFields.value?.includes(param.id)) {
    const dependedUponParam = appStore.parametersMetadataById[param.updateNumericFrom.parameterId];
    const range = dependentRange(param);

    if (dependedUponParam && range) {
      const selectedOption = dependedUponParam.options?.find(o => o.id === (formData.value ?? {})[dependedUponParam.id]);
      return `NB: This value is outside the estimated range for ${selectedOption?.label} (${range.min}–${range.max}).`
        + ` Proceed with caution.`;
    }
  } else {
    return "This field is required.";
  }
};

const pulse = (parameterId: string) => {
  pulsingParameters.value.push(parameterId);
  setTimeout(() => {
    pulsingParameters.value = pulsingParameters.value.filter(item => item !== parameterId); // Remove the pulse animation to allow it to be triggered again in the future.
  }, 500);
};

const handleChange = (param: Parameter) => {
  showWarnings.value = true;

  if (parameterDependencies.value[param.id] === undefined || parameterDependencies.value[param.id]?.length === 0) {
    return;
  }

  parameterDependencies.value[param.id].forEach((dependentParamId: string) => {
    pulse(dependentParamId);

    const dependentParameter = appStore.parametersMetadataById[dependentParamId];
    const newValueForDependentParam = defaultValue(dependentParameter);
    if (newValueForDependentParam) {
      formData.value![dependentParamId] = newValueForDependentParam;
    }
  });

  if (param.parameterType === TypeOfParameter.GlobeSelect) {
    appStore.globe.highlightedCountry = formData.value![param.id];
  };
};

const handleInput = () => {
  // Stop showing warnings while the user is typing
  showWarnings.value = false;

  debounce(() => {
    showWarnings.value = true;
  }, 500)();
};

const submitForm = async () => {
  if (invalidFields.value?.length || !formData.value) {
    showValidations.value = true;
    return;
  }

  // If the user has not changed the highlighted country since loading the app, then it will still be null,
  // since we don't want to highlight any particular country until the user chooses one. So now we need
  // to set it to the value being submitted in the form. This triggers the Globe component to focus the country.
  if (!appStore.globe.highlightedCountry && appStore.globeParameter?.id && formData.value) {
    appStore.globe.highlightedCountry = formData.value[appStore.globeParameter.id];
  }

  formSubmitting.value = true;

  appStore.currentScenario.parameters = { ...formData.value };
  await appStore.runScenario(appStore.currentScenario);

  if (appStore.currentScenario.runId) {
    await navigateTo(`/scenarios/${appStore.currentScenario.runId}`);
  }
};

// Handle the selection of a country using the globe component: update the form country value.
watch(() => appStore.globe.highlightedCountry, (newValue, oldValue) => {
  if (formData.value && !formSubmitting.value && newValue && newValue !== oldValue && appStore.globeParameter?.id
    && formData.value[appStore.globeParameter.id] !== newValue) {
    formData.value[appStore.globeParameter.id] = newValue;
    pulse(appStore.globeParameter.id);
    handleChange(appStore.globeParameter);
  }
});

watch(formData, () => {
  if (!formData.value && paramMetadata.value) {
    invalidFields.value = paramMetadata.value.map(p => p.id);
    return;
  }

  invalidFields.value = paramMetadata.value?.filter((param) => {
    const val = formData.value![param.id];
    return ((!val && val !== 0) || numericValueInvalid(val, param));
  }).map(p => p.id) || [];
}, { deep: 1 });

onMounted(() => {
  mounted.value = true; // Use in v-show, otherwise there are up to several seconds during which the form shows with out of date values.

  // Set fields whose default values are dependent on other fields' values to their defaults, except if they have been set from the store.
  paramMetadata.value?.filter((param) => {
    const isDependent = param.updateNumericFrom !== undefined;
    const shouldBeSetFromStore = !!appStore.currentScenario?.parameters?.[param.id];
    return isDependent && !shouldBeSetFromStore;
  }).forEach(resetParam);
});
</script>

<style scoped lang="scss">
.inputs {
  display: flex;
  flex-wrap: wrap;
  row-gap: 1rem;
  column-gap: 1rem;
  position: relative; // Provide a 'nearest positioned ancestor' for the tooltip element.
}

.field-container {
  flex-grow: 1;

  input[type=range]::-webkit-slider-runnable-track {
    background: #fff;
    border: $input-border-width solid $input-border-color;
  }
}

#run-button {
  min-width: 6rem;
  margin-top: 2rem; // Align button with height of labels when it shares a row with an input.
}

.pulse {
  animation: pulse-animation 0.5s 1;

  &.infinite {
    animation: pulse-animation 0.5s infinite;
  }
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px rgba(0, 0, 255, 0.25);
  }
  90% {
    box-shadow: 0 0 0 13.5px rgba(0, 0, 255, 0.01);
  }
  100% {
    box-shadow: 0 0 0 15px rgba(0, 0, 255, 0);
  }
}

.select-container {
   margin-left: 0.7rem;
   margin-right: 0.55rem;
}

.numeric-header {
  padding-right: 2.2rem;
}

:deep(.has-warning .form-control.is-invalid) {
  border-color: $warning;
  box-shadow: 0 0 0 0.25rem rgba(var(--cui-warning-rgb), 0.25);

  // Undo CoreUI stylings related to the validation icon, which looks like: (!)
  background-image: unset;
  padding-right: 1rem;
}

:deep(.has-warning .invalid-tooltip) {
  background-color: $warning;
}

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

:deep(.single-value .fi) {
  margin-bottom: 0.2rem;
}
</style>
