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
              class="form-control"
              :class="[pulsingParameters.includes(parameter.id) ? 'pulse' : '']"
              :options="parameter.options.map((o) => ({ value: o.id, label: o.label, description: o.description }))"
              :is-clearable="false"
              @option-selected="handleChange(parameter)"
            >
              <template #option="{ option }">
                <div class="parameter-option">
                  <span>{{ option.label }}</span>
                  <div
                    v-if="option.description"
                    :class="option.value === formData[parameter.id] ? 'text-dark' : 'text-secondary'"
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
            <div class="flex-grow-1">
              <CFormInput
                :id="parameter.id"
                v-model="formData[parameter.id]"
                :aria-label="parameter.label"
                type="number"
                :class="`${pulsingParameters.includes(parameter.id) ? 'pulse' : ''}`"
                :min="min(parameter)"
                :max="max(parameter)"
                :step="parameter.step"
                :size="appStore.largeScreen ? 'lg' : undefined"
                :feedback-invalid="numericParameterFeedback(parameter)"
                :data-valid="!invalidFields?.includes(parameter.id)"
                :invalid="invalidFields?.includes(parameter.id) && showValidations"
                :valid="!invalidFields?.includes(parameter.id) && showValidations"
                :tooltip-feedback="true"
                @change="handleChange(parameter)"
              />
              <CFormRange
                :id="parameter.id"
                v-model="formData[parameter.id]"
                :aria-label="parameter.label"
                :step="parameter.step"
                :min="min(parameter)"
                :max="max(parameter)"
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
import type { NewScenarioData } from "@/types/apiResponseTypes";
import type { Parameter, ParameterSet, ValueData } from "@/types/parameterTypes";
import type { FetchError } from "ofetch";
import { TypeOfParameter } from "@/types/parameterTypes";
import { CIcon } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";
import ParameterHeader from "~/components/ParameterHeader.vue";

const props = defineProps<{
  inModal: boolean
}>();

const appStore = useAppStore();

const formSubmitting = ref(false);
const showValidations = ref(false);
const mounted = ref(false);

const paramMetadata = computed(() => appStore.metadata?.parameters);

const initialiseFormDataFromDefaults = () => {
  return paramMetadata.value?.reduce((acc, { id, defaultOption, options, updateNumericFrom }) => {
    if (options && !updateNumericFrom) { // Excludes fields whose values depend on others'; we'll set these once all the defaults are set.
      acc[id] = (defaultOption || options[0].id).toString();
    }
    return acc;
  }, {} as { [key: string]: string });
};

const formData = ref(
  // Initialize formData as a dictionary of parameters with values set to defaults if available,
  // or to the previous scenario's values if any.
  appStore.currentScenario.parameters ? { ...appStore.currentScenario.parameters } : initialiseFormDataFromDefaults(),
);

// Making the vue select searchable means that it's possible to unset a parameter value (to undefined) if you clear the search
// input. In this case we just want to be able to revert to the previous value it had. However, this is tricky as we
// don't get the previous value in any watch of formData since it's watching deep changes in an object, and we can't
// use a computed setter for values in an object type. So here we keep a copy of the last full dictionary and reset in the watch
// if required.
const previousFullFormData = ref({ ...formData.value });

const pulsingParameters = ref([] as string[]);
const dependentParameters = computed((): Record<string, string[]> => {
  const dependentParameters = {} as { [key: string]: Array<string> };
  paramMetadata.value?.forEach((param) => {
    if (param.updateNumericFrom) {
      const dependedOn = param.updateNumericFrom.parameterId;
      if (!dependentParameters[dependedOn]) {
        dependentParameters[dependedOn] = [];
      }
      dependentParameters[dependedOn].push(param.id);
    }
  });
  return dependentParameters;
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

const optionsAreTerse = (param: Parameter) => {
  const eachOptionIsASingleWord = param.options.every((option) => {
    return !option.label.includes(" ");
  });

  return param.options.length <= 5 && eachOptionIsASingleWord;
};

const renderAsRadios = (param: Parameter) => {
  return param.parameterType === TypeOfParameter.Select && optionsAreTerse(param);
};

const renderAsSelect = (param: Parameter) => {
  return !renderAsRadios(param) && [TypeOfParameter.Select, TypeOfParameter.GlobeSelect].includes(param.parameterType);
};

// Retrieve the ValueData for a (numeric) parameter that is dependent on the value of another parameter.
const getValueDataForDependentParam = (dependentParamId: string): ValueData | undefined => {
  const dependentParam = paramMetadata.value!.find(param => param.id === dependentParamId);
  if (!dependentParam?.updateNumericFrom || !formData.value) {
    return;
  }

  const dependedOnParamId = dependentParam.updateNumericFrom.parameterId;
  const dependedOnParamInputVal = formData.value[dependedOnParamId];
  if (dependentParam.updateNumericFrom && typeof dependedOnParamInputVal !== "undefined") {
    return dependentParam.updateNumericFrom?.values[dependedOnParamInputVal.toString()];
  }
};

const min = (param: Parameter) => {
  return getValueDataForDependentParam(param.id)?.min;
};

const max = (param: Parameter) => {
  return getValueDataForDependentParam(param.id)?.max;
};

const invalidFields = computed(() => {
  if (!formData.value && paramMetadata.value) {
    return paramMetadata.value.map(param => param.id);
  }

  const invalids = new Array<string>();
  paramMetadata.value?.forEach((param) => {
    if (formData.value![param.id] === "") {
      invalids.push(param.id);
    };

    if (param.parameterType === TypeOfParameter.Numeric && param.updateNumericFrom) {
      const inputVal = Number.parseInt(formData.value![param.id]);

      if (inputVal < min(param)! || inputVal > max(param)!) {
        invalids.push(param.id);
      }
    };
  });

  return invalids;
});

// Since some defaults depend on the values of other fields, this function should not be used to initialize form values.
const defaultValue = (param: Parameter) => {
  if (!formData.value) {
    return;
  }

  if (param.updateNumericFrom) {
    const dependedOnParamId = param.updateNumericFrom.parameterId;
    const dependedOnValue = formData.value[dependedOnParamId];
    const dependentDefaultValue = param.updateNumericFrom.values[dependedOnValue]?.default;
    return dependentDefaultValue?.toString();
  } else if (param.parameterType === TypeOfParameter.Select || param.parameterType === TypeOfParameter.GlobeSelect) {
    return param.defaultOption || param.options[0].id;
  }
  // Currently, due to the metadata schema, non-updatable numerics don't have default values available.
};

const valueIsAtDefault = (param: Parameter) => {
  return formData.value![param.id] === defaultValue(param);
};

const resetParam = (param: Parameter) => {
  formData.value![param.id] = defaultValue(param) as string;
};

const numericParameterFeedback = (param: Parameter) => {
  if (param.updateNumericFrom) {
    const dependedOnParamId = param.updateNumericFrom.parameterId;
    const dependedOnParamOptionLabel = paramMetadata.value!.find(param => param.id === dependedOnParamId)!
      .options
      .find(option => option.id === formData.value![dependedOnParamId])
      ?.label;
    return `${min(param)} to ${max(param)} is the allowed ${param.label.toLowerCase()} range for ${dependedOnParamOptionLabel}.`;
  }
};

const handleChange = (param: Parameter) => {
  if (dependentParameters.value[param.id] === undefined || dependentParameters.value[param.id]?.length === 0) {
    return;
  }

  dependentParameters.value[param.id].forEach((dependentParamId: string) => {
    pulsingParameters.value.push(dependentParamId);
    setTimeout(() => {
      pulsingParameters.value = pulsingParameters.value.filter(item => item !== dependentParamId); // Remove the pulse animation to allow it to be triggered again in the future.
    }, 500);

    const dependentParameter = paramMetadata.value!.find(param => param.id === dependentParamId)!;
    const newValueForDependentParam = defaultValue(dependentParameter);
    if (newValueForDependentParam) {
      formData.value![dependentParamId] = newValueForDependentParam;
    }
  });
};

const submitForm = async () => {
  if (invalidFields.value?.length) {
    showValidations.value = true;
    return;
  }

  appStore.downloadError = undefined;
  formSubmitting.value = true;

  const response = await $fetch<NewScenarioData>("/api/scenarios", {
    method: "POST",
    body: { parameters: formData.value },
  }).catch((error: FetchError) => {
    console.error(error);
  });

  if (response) {
    const { runId } = response;
    if (runId) {
      appStore.clearScenario();
      appStore.currentScenario.parameters = formData.value as ParameterSet;
    }
    await navigateTo(`/scenarios/${runId}`);
  };
};

watch(formData, (newVal) => {
  if (newVal && paramMetadata.value && previousFullFormData.value) {
    const invalid = paramMetadata.value.some(param => !newVal[param.id]);
    if (invalid) {
      formData.value = previousFullFormData.value;
    } else {
      previousFullFormData.value = { ...formData.value };
    }
  }
}, { deep: 1 });

onMounted(() => {
  mounted.value = true; // Use in v-show, otherwise there are up to several seconds during which the form shows with out of date values.

  // Set fields whose default values are dependent on other fields' values to their defaults, except if they have been set from the store.
  paramMetadata.value?.filter((param) => {
    const isDependent = param.updateNumericFrom !== undefined;
    const shouldBeSetFromStore = appStore.currentScenario?.parameters?.[param.id];
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
  position: relative; // Provide a 'nearest positioned ancestor' for the feedback element.
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
  margin-left: auto;
  align-self: flex-start;
  margin-top: 2rem; // Align button with height of labels when it shares a row with an input.
}

.pulse {
  animation: pulse-animation 0.5s 1;
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

.vue-select {
  --vs-font-size: 1.25rem;
  --vs-input-outline: transparent;
  --vs-border-radius: 4px;
  --vs-line-height: 0.9;
  --vs-menu-height: 400px;
  --vs-padding: 0;
  --vs-option-font-size: var(--vs-font-size);
  --vs-option-text-color: var(--vs-text-color);
  --vs-option-hover-color: var(--cui-tertiary-bg);
  --vs-option-focused-color: var(--vs-option-hover-color);
  --vs-option-selected-color: var(--cui-primary-bg-subtle);
  --vs-option-padding: 0 8px;
}

.vue-select  {
  border-radius: 1rem!important;
}

:deep(.vue-select .control) {
  border-style: none;
}

:deep(.vue-select .menu) {
  border-radius: 0.5rem!important;
}

// This prevents odd default styling where search text appears after width of current value
:deep(.vue-select .search-input) {
  position: absolute;
  left: 0;
  width: 100%;
}

// This fixes an issue where the open select contracted in width because .single-value items had absolute position
:deep(.open .single-value) {
  position: relative!important;
}
</style>
