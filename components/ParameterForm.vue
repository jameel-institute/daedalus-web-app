<template>
  <div v-show="pageMounted">
    <CForm
      v-if="props.metadata && formData"
      class="inputs"
      role="form"
      :data-test-form-data="JSON.stringify(formData)"
      :data-test-navigate-to="navigateToData"
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
              :size="screenIsLarge ? 'lg' : undefined"
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
                :disabled="!pageMounted"
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
            class="form-select" :class="[screenIsLarge ? 'form-select-lg' : '']"
            :disabled="!pageMounted"
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
        :size="screenIsLarge ? 'lg' : undefined"
        type="submit"
        :disabled="formSubmitting || !pageMounted"
        @click="submitForm"
      >
        Run
        <CSpinner v-if="formSubmitting" size="sm" class="ms-1" />
        <CIcon v-else icon="cilArrowRight" />
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
import { ParameterType } from "@/types/apiResponseTypes";
import type { Metadata, NewScenarioData, Parameter } from "@/types/apiResponseTypes";
import type { AsyncDataRequestStatus } from "#app";

const props = defineProps<{
  metadata: Metadata | undefined
  metadataFetchStatus: AsyncDataRequestStatus
  metadataFetchError: FetchError | null
}>();

const formData = ref(
  // Create a new object with keys set to the id values of the metadata.parameters array of objects, and all values set to default values.
  props.metadata?.parameters.reduce((acc, { id, defaultOption, options }) => {
    acc[id] = defaultOption || options[0].id;
    return acc;
  }, {} as { [key: string]: string | number }),
);

const appStore = useAppStore();
const { screenIsLarge } = storeToRefs(appStore);
const navigateToData = ref("");
const pageMounted = ref(false);

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

const formSubmitting = ref(false);

const submitForm = async () => {
  if (!formData.value) {
    return;
  };

  const formDataObject = new FormData();
  Object.entries(formData.value).forEach(([key, value]) => {
    formDataObject.append(key, value.toString());
  });

  formSubmitting.value = true;
  const response = await $fetch<NewScenarioData>("/api/scenarios", {
    method: "POST",
    body: formDataObject,
  }).catch((error: FetchError) => {
    console.error(error);
  });

  if (response) {
    const { runId } = response;
    navigateToData.value = `/scenarios/${runId}`;
    await navigateTo(navigateToData.value);
  };
};

onMounted(() => {
  pageMounted.value = true;
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
