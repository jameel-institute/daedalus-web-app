<template>
  <div>
    <CForm
      v-if="props.metaData && formData"
      class="inputs"
      :data-test="JSON.stringify(formData)"
      @submit.prevent="submitForm"
    >
      <div
        v-for="(parameter) in props.metaData.parameters"
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
              :size="largeScreen ? 'lg' : undefined"
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
        <div v-else-if="renderAsSelect(parameter)">
          <ParameterIcon :parameter="parameter" />
          <CFormLabel :for="parameter.id">
            {{ parameter.label }}
          </CFormLabel>
          <select
            :id="parameter.id"
            v-model="formData[parameter.id]"
            :aria-label="parameter.label"
            class="form-select" :class="[largeScreen ? 'form-select-lg' : '']"
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
      </div>
      <CButton
        id="run-button"
        color="primary"
        :size="largeScreen ? 'lg' : undefined"
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
import type { MetaData, Parameter } from "@/types/daedalusApiResponseTypes";
import type { AsyncDataRequestStatus } from "#app";

const props = defineProps<{
  metaData: MetaData | undefined
  metadataFetchStatus: AsyncDataRequestStatus
  metadataFetchError: FetchError | null
}>();

const formData = ref(
  // Create a new object with keys set to the id values of the metaData.parameters array of objects, and all values set to refs with default values.
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

const optionsAreTerse = (parameter: Parameter) => {
  const eachOptionIsASingleWord = parameter.options.every((option) => {
    return !option.label.includes(" ");
  });

  return parameter.options.length <= 5 && eachOptionIsASingleWord;
};

const renderAsSelect = (parameter: Parameter) => {
  return parameter.parameterType === "select" || parameter.parameterType === "globeSelect";
};

const renderAsRadios = (parameter: Parameter) => {
  return parameter.parameterType === "select" && optionsAreTerse(parameter);
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
}

#run-button {
  align-self: flex-end;
  min-width: 6rem;
  margin-left: auto;
}
</style>
