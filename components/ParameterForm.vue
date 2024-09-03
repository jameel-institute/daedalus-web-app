<template>
  <div>
    <CForm
      v-if="props.metaData && formData"
      class="inputs"
      :data-test="JSON.stringify(formData)"
      @submit.prevent="submitForm"
    >
      <div
        v-for="(parameter) in parametersOfTypeSelect"
        :key="parameter.id"
        class="field-container"
      >
        <CCol v-if="optionsAreTerse(parameter)" class="button-group-container">
          <CRow>
            <CIcon
              v-if="icon(parameter)"
              :icon="icon(parameter)"
              class="parameter-icon"
            />
            <CFormLabel :for="parameter.id">
              {{ parameter.label }}
            </CFormLabel>
          </CRow>
          <CRow>
            <CButtonGroup
              role="group"
              :aria-label="parameter.label"
              :size="largeScreen ? 'lg' : ''"
            >
              <CFormCheck
                v-for="(option) in parameter.options"
                :id="option.id"
                :key="option.id"
                v-model="formData[parameter.id]"
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
        <div v-else>
          <CIcon
            v-if="icon(parameter)"
            :icon="icon(parameter)"
            class="parameter-icon"
          />
          <CFormSelect
            :id="parameter.id"
            v-model="formData[parameter.id]"
            :label="parameter.label"
            :aria-label="parameter.label"
            :options="parameter.options.map((option: ParameterOption) => {
              return { label: option.label, value: option.id };
            })"
            :size="largeScreen ? 'lg' : ''"
          />
        </div>
      </div>
      <div
        v-if="globeParameter"
        class="field-container"
      >
        <CIcon
          v-if="icon(globeParameter)"
          :icon="icon(globeParameter)"
          class="parameter-icon"
        />
        <CFormSelect
          :id="globeParameter.id"
          v-model="formData[globeParameter.id]"
          :data-test="`${globeParameter.id}-select`"
          :label="globeParameter.label"
          :aria-label="globeParameter.label"
          :options="selectOptions(globeParameter)"
          :size="largeScreen ? 'lg' : ''"
        />
      </div>
      <CButton
        id="run-button"
        color="primary"
        :size="largeScreen ? 'lg' : ''"
        type="submit"
      >
        Run
        <CIcon
          icon="cilArrowRight"
        />
      </CButton>
    </CForm>
    <CAlert v-else-if="props.metadataFetchStatus === 'error'" color="warning">
      Failed to retrieve metadata from R API. {{ metadataFetchError }}
    </CAlert>
    <CSpinner v-else-if="props.metadataFetchStatus === 'pending'" />
  </div>
</template>

<script lang="ts" setup>
import type { FetchError } from "ofetch";
import { CIcon } from "@coreui/icons-vue";
import type { MetaData, Parameter, ParameterOption } from "@/types/daedalusApiResponseTypes";
import type { AsyncDataRequestStatus } from "#app";

const props = defineProps<{
  globeParameter: Parameter | undefined
  metaData: MetaData | undefined
  metadataFetchStatus: AsyncDataRequestStatus
  metadataFetchError: FetchError | null
}>();

const formData = ref(
  // Create a new object with keys set to the id values of the metaData.parameters array of objects, and all values set to empty refs.
  props.metaData?.parameters.reduce((accumulator, parameter) => {
    if (parameter.parameterType !== "select" && parameter.parameterType !== "globeSelect") {
      accumulator[parameter.id] = ref("");
      return accumulator;
    }

    // TODO: Make default country UK after November 2024 workshop
    if (parameter.id === "country") {
      accumulator[parameter.id] = ref("Thailand");
    } else {
      // Don't set an empty value or there will be a disjoint between the select component and the formData object,
      // since the select component will visually appear to have an option selected (the first), but the formData object will have
      // an empty string.
      const defaultOption = parameter.defaultOption || parameter.options[0].id;
      accumulator[parameter.id] = ref(defaultOption);
    }

    return accumulator;
  }, {} as { [key: string]: any }),
);

const parametersOfTypeSelect = computed(() => {
  if (props.metaData) {
    return props.metaData.parameters.filter(parameter => parameter.parameterType === "select");
  } else {
    return [];
  }
});

const globeParameter = computed(() => {
  if (props.metaData) {
    return props.metaData.parameters.filter(parameter => parameter.parameterType === "globeSelect")[0];
  } else {
    return undefined;
  }
});

const icon = (parameter: Parameter) => {
  switch (parameter.id) {
    case "country":
      return "cilGlobeAlt";
    case "response":
      return "cilShieldAlt";
    case "vaccine":
      return "cilIndustry";
    case "pathogen":
      return "cilBug";
    default:
      return undefined;
  }
};

const selectOptions = (parameter: Parameter) => {
  return parameter.options.map((option: ParameterOption) => {
    // Because the select component does not seem to honour the initial v-model value, we had to manually
    // set the 'selected' attribute below.
    // As a result, this list of options is recalculated each time an option is selected.
    return { label: option.label, value: option.id, selected: option.id === formData.value![parameter.id] };
  });
};

const optionsAreTerse = (parameter: Parameter) => {
  const eachOptionIsASingleWord = parameter.options.filter((option) => {
    return option.label.includes(" ");
  }).length === 0;

  return parameter.options.length <= 5 && eachOptionIsASingleWord;
};

const submitForm = () => {
  // Not implemented yet
};

const largeScreen = ref(true);
const breakpoint = 992; // CoreUI's "lg" breakpoint
const setFieldSizes = () => {
  if (window.innerWidth < breakpoint) {
    largeScreen.value = false;
  } else {
    largeScreen.value = true;
  }
};

onMounted(() => {
  setFieldSizes();
  window.addEventListener("resize", setFieldSizes);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", setFieldSizes);
});
</script>

<style lang="scss">
.inputs {
  display: flex;
  flex-wrap: wrap;
  row-gap: 1rem;
  column-gap: 1rem;
}

.field-container {
  min-width: 15rem;
  flex-grow: 1;

  .parameter-icon {
    margin-left: 0.75rem;
    margin-right: 0.5rem;
    padding: 0;
  }

  .button-group-container .parameter-icon {
    margin-left: 1.5rem;
  }
}

#run-button {
  align-self: flex-end;
  min-width: 7rem;
}
</style>
