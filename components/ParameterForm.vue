<template>
  <div>
    <CForm
      v-if="props.metadata && formData"
      class="inputs"
      :data-test="JSON.stringify(formData)"
      @submit.prevent="submitForm"
    >
      <div
        v-for="(parameter) in props.metadata.parameters"
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
import type { Metadata, Parameter } from "@/types/daedalusApiResponseTypes";
import { ParameterType } from "@/types/daedalusApiResponseTypes";
import type { AsyncDataRequestStatus } from "#app";

const props = defineProps<{
  metadata: Metadata | undefined
  metadataFetchStatus: AsyncDataRequestStatus
  metadataFetchError: FetchError | null
}>();

const formData = props.metadata
  ? ref(
    // Create a new object with keys set to the id values of the metadata.parameters array of objects, and all values set to refs with default values.
    props.metadata.parameters.reduce((accumulator, parameter) => {
      accumulator[parameter.id] = parameter.defaultOption || parameter.options[0].id;
      return accumulator;
    }, {} as { [key: string]: string | number }),
  )
  : ref(undefined);

const optionsAreTerse = (parameter: Parameter) => {
  const eachOptionIsASingleWord = parameter.options.every((option) => {
    return !option.label.includes(" ");
  });

  return parameter.options.length <= 5 && eachOptionIsASingleWord;
};

const renderAsSelect = (parameter: Parameter) => {
  return parameter.parameterType === ParameterType.Select || parameter.parameterType === ParameterType.GlobeSelect;
};

const renderAsRadios = (parameter: Parameter) => {
  return parameter.parameterType === ParameterType.Select && optionsAreTerse(parameter);
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
