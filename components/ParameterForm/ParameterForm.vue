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
          <ParameterRadio
            v-model:parameter-value="formData[parameter.id]"
            :parameter="parameter"
            :pulsing="pulsingParameters.includes(parameter.id)"
            @change="handleChange(parameter)"
          />
        </div>
        <div v-else-if="renderAsSelect(parameter)" class="select-container">
          <ParameterSelect
            v-model:parameter-value="formData[parameter.id]"
            :parameter="parameter"
            :pulsing="pulsingParameters.includes(parameter.id)"
            @change="handleChange(parameter)"
          />
        </div>
        <div v-else-if="parameter.parameterType === TypeOfParameter.Numeric">
          <ParameterNumericInput
            v-model:parameter-value="formData[parameter.id]"
            :parameter="parameter"
            :parameter-set="formData"
            :pulsing="pulsingParameters.includes(parameter.id)"
            :show-validations="showValidations"
            @change="handleChange(parameter)"
          />
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
import type { Parameter, ParameterSet } from "@/types/parameterTypes";
import { TypeOfParameter } from "@/types/parameterTypes";
import { CIcon } from "@coreui/icons-vue";
import { getRangeForDependentParam } from "~/components/utils/parameters";
import { numericValueInvalid } from "~/components/utils/validations";
import type { ParameterNumericInput } from "#components";

const props = defineProps<{
  inModal: boolean
}>();

const appStore = useAppStore();

const formSubmitting = ref(false);
const showValidations = ref(false);
const mounted = ref(false);
const invalidFields = ref<string[]>([]);

const paramMetadata = computed(() => appStore.metadata?.parameters);

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

const resetParam = (param: Parameter) => {
  formData.value![param.id] = defaultValue(param) as string;
};

const pulse = (parameterId: string) => {
  pulsingParameters.value.push(parameterId);
  setTimeout(() => {
    pulsingParameters.value = pulsingParameters.value.filter(item => item !== parameterId); // Remove the pulse animation to allow it to be triggered again in the future.
  }, 500);
};

const handleChange = (param: Parameter) => {
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
    return (!val || numericValueInvalid(val, param));
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

:deep(.pulse) {
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

:deep(.numeric-header) {
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

:deep(.single-value .fi) {
  margin-bottom: 0.2rem;
}
</style>
