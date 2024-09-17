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
        <CCol v-if="renderAsRadios(parameter)" class="button-group-container">
          <CRow>
            <ParameterIcon :parameter="parameter" />
            <CFormLabel :for="parameter.id">
              {{ parameter.label }}
            </CFormLabel>
          </CRow>
          <CRow>
            <CButtonGroup
              role="group"
              :aria-label="parameter.label"
              :size="appStore.largeScreen ? 'lg' : undefined"
              :class="`${pulsingParameters.includes(parameter.id) ? 'pulse' : ''}`"
              @change="handleChange(parameter)"
            >
              <!-- This component's "v-model" prop type signature dictates we can't pass it a number. -->
              <CFormCheck
                v-for="(option) in parameter.options"
                :id="option.id"
                :key="option.id"
                v-model="formData[parameter.id] as string"
                type="radio"
                :button="{ color: 'primary', variant: 'outline' }"
                :name="parameter.id"
                autocomplete="off"
                :label="option.label"
                :value="option.id"
              />
            </CButtonGroup>
          </CRow>
        </CCol>
        <div v-else-if="renderAsSelect(parameter)">
          <ParameterIcon :parameter="parameter" />
          <CFormLabel :for="parameter.id">
            {{ parameter.label }}
          </CFormLabel>
          <select
            :id="parameter.id"
            v-model="formData[parameter.id]"
            :aria-label="parameter.label"
            class="form-select" :class="[appStore.largeScreen ? 'form-select-lg' : '', pulsingParameters.includes(parameter.id) ? 'pulse' : '']"
            @change="handleChange(parameter)"
          >
            <option
              v-for="(option) in parameter.options"
              :key="option.id"
              :value="option.id"
              :selected="option.id === formData[parameter.id]"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div v-else-if="parameter.parameterType === TypeOfParameter.Numeric">
          <ParameterIcon :parameter="parameter" />
          <CFormLabel :for="parameter.id">
            {{ parameter.label }}
          </CFormLabel>
          <div class="d-flex flex-wrap">
            <div class="flex-grow-1">
              <CFormInput
                :id="parameter.id"
                v-model="formData[parameter.id] as string"
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
                v-model="formData[parameter.id] as string"
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
        :disabled="formSubmitting || appStore.metadataFetchStatus === 'error'"
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
import type { FetchError } from "ofetch";
import { CIcon } from "@coreui/icons-vue";
import type { Parameter, ValueData } from "@/types/parameterTypes";
import { TypeOfParameter } from "@/types/parameterTypes";
import type { NewScenarioData } from "@/types/apiResponseTypes";

const appStore = useAppStore();

const paramMetadata = computed(() => appStore.metadata?.parameters);

const formData = ref(
  // Create a new object with keys set to the id values of the metadata.parameters array of objects, and all values set to default values.
  paramMetadata.value?.reduce((acc, { id, defaultOption, options, updateNumericFrom }) => {
    if (options && !updateNumericFrom) { // Excludes fields whose values depend on others'; we'll set these once all the defaults are set.
      acc[id] = (defaultOption || options[0].id).toString();
    }
    return acc;
  }, {} as { [key: string]: string | number }),
);
const pulsingParameters = ref([] as string[]);
const dependentParameters = computed((): Record<string, Array<string>> => {
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
const formSubmitting = ref(false);
const showValidations = ref(false);
const mounted = ref(false);

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

  const foreignParamId = dependentParam.updateNumericFrom.parameterId;
  const foreignParamInputVal = formData.value[foreignParamId];
  if (dependentParam.updateNumericFrom && typeof foreignParamInputVal !== "undefined") {
    return dependentParam.updateNumericFrom?.values[foreignParamInputVal.toString()];
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

  const invalids = Array<string>();
  paramMetadata.value?.forEach((param) => {
    if (formData.value![param.id] === "") {
      invalids.push(param.id);
    };

    if (param.parameterType === TypeOfParameter.Numeric && param.updateNumericFrom) {
      const inputVal = Number.parseInt(formData.value![param.id] as string);

      if (inputVal < min(param)! || inputVal > max(param)!) {
        invalids.push(param.id);
      }
    };
  });

  return invalids;
});

const defaultValue = (param: Parameter) => {
  if (param.updateNumericFrom) {
    const foreignParamId = param.updateNumericFrom.parameterId;
    return param.updateNumericFrom.values[formData.value![foreignParamId]].default.toString();
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
    const foreignParamId = param.updateNumericFrom.parameterId;
    const foreignParamOptionLabel = paramMetadata.value!.find(param => param.id === foreignParamId)!
      .options.find(option => option.id === formData.value![foreignParamId])?.label;
    return `${min(param)} to ${max(param)} is the allowed ${param.label.toLowerCase()} range for ${foreignParamOptionLabel}.`;
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
  };

  formSubmitting.value = true;

  const response = await $fetch<NewScenarioData>("/api/scenarios", {
    method: "POST",
    body: { parameters: formData.value },
  }).catch((error: FetchError) => {
    console.error(error);
  });

  if (response) {
    const { runId } = response;
    await navigateTo(`/scenarios/${runId}`);
  }
};

// Set fields whose default values are dependent on other fields' values to their defaults.
const resetAllDependents = () => {
  paramMetadata.value?.filter((param) => {
    return param.updateNumericFrom !== undefined;
  }).forEach(resetParam);
};

onMounted(() => {
  mounted.value = true; // Use in v-show, otherwise there are up to several seconds during which the form shows with out of date values.
  resetAllDependents(); // To do this, we need metadata to have been fetched, so do this in the onMounted hook.
});
</script>

<style lang="scss">
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
</style>
