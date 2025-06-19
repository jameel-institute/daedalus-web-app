<template>
  <div v-if="appStore.currentScenario.result.data" class="d-inline-block ms-auto">
    <div>
      <CButton
        color="primary"
        class="btn-scenario-header fs-6 d-flex"
        @click="() => { modalVisible = true; }"
      >
        <CIconSvg class="icon m-0 align-self-center" style="height: 1.2rem; width: 1.2rem;">
          <img src="~/assets/img/axes-white.png" alt="Icon for comparing scenarios">
        </CIconSvg>
        <span class="ms-2 align-self-end">Compare against other scenarios</span>
      </CButton>
    </div>
    <!-- TODO: (jidea-230) Use 'size' prop to widen modal when selecting country -->
    <CModal
      :visible="modalVisible"
      aria-labelledby="chooseAxisModalTitle"
      @close="handleCloseModal"
    >
      <CModalHeader>
        <CModalTitle id="chooseAxisModalTitle">
          <CIconSvg class="icon me-2" style="height: 1.3rem; width: 1.3rem;">
            <img src="~/assets/img/axes-black.png" alt="Icon for comparing scenarios">
          </CIconSvg>
          <span class="pt-1 pe-1">Start a comparison against this baseline</span>
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p class="fs-5 form-label">
          Which parameter would you like to explore?
        </p>
        <div id="axisOptions" class="d-flex gap-2 flex-wrap">
          <CButton
            v-for="para in appStore.metadata?.parameters.filter((p) => !chosenAxisId || chosenAxisId === p.id)"
            :key="para.id"
            class="d-flex align-items-center axis-btn border"
            :class="chosenAxisId === para.id ? 'bg-primary bg-opacity-10 border-primary-subtle' : ''"
            color="light"
            @click="handleClickAxis(para)"
          >
            <ParameterIcon :parameter="para" />
            <span class="ms-2">{{ para.label }}</span>
            <CIcon v-if="chosenAxisId === para.id" class="text-muted ms-2 cilx" icon="cilX" />
          </CButton>
        </div>
        <div v-if="chosenParameterAxis && baselineOption" class="mt-3">
          <CFormLabel :id="FORM_LABEL_ID" :for="FORM_LABEL_ID" class="fs-5 form-label">
            Compare baseline scenario
            <CTooltip
              content="To change the baseline, click the x button above and edit the current scenario's parameters."
              placement="top"
            >
              <template #toggler="{ togglerId, on }">
                <!-- TODO: use humanReadableInteger formatter for numeric parameters -->
                <span
                  :class="{
                    'bg-warning text-white': chosenParameterAxis.parameterType === TypeOfParameter.Numeric && numericValueIsOutOfRange(baselineOption.id),
                  }"
                  class="multi-value d-inline-block outside-select"
                  :aria-describedby="togglerId"
                  v-on="on"
                >
                  {{ baselineOption?.label }}
                </span>
              </template>
            </CTooltip>
            against:
          </CFormLabel>
          <div class="d-flex gap-3">
            <ScenarioSelect
              v-model:selected="selectedScenarioOptions"
              :show-feedback="showFormValidationFeedback"
              :parameter-axis="chosenParameterAxis"
              :label-id="FORM_LABEL_ID"
            />
            <CButton
              id="run-button"
              color="primary"
              :size="appStore.largeScreen ? 'lg' : undefined"
              type="submit"
              :disabled="formSubmitting"
              class="ms-auto align-self-start"
              @click="submitForm"
            >
              Compare
              <CSpinner v-if="formSubmitting" size="sm" class="ms-1" />
              <CIcon v-else icon="cilArrowRight" />
            </CButton>
          </div>
        </div>
      </CModalBody>
    </CModal>
  </div>
</template>

<script setup lang="ts">
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { MAX_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";

const appStore = useAppStore();
const FORM_LABEL_ID = "scenarioOptions";
const selectedScenarioOptions = ref<string[]>([]);
const modalVisible = ref(false);
const chosenAxisId = ref("");
const formSubmitting = ref(false);
// Visible feedback will be shown on submitting an invalid form, and cleared when options are changed
const showFormValidationFeedback = ref(false);

const chosenParameterAxis = computed(() => appStore.metadata?.parameters.find(p => p.id === chosenAxisId.value));

const { baselineOption, nonBaselineOptions } = useScenarioOptions(chosenParameterAxis);
const { invalid: scenarioSelectionInvalid, dependentValues } = useComparisonValidation(selectedScenarioOptions, chosenParameterAxis);

// begin duplicated logic
const numericValueIsOutOfRange = (value: string) => {
  const val = Number.parseInt(value);
  return val < dependentValues.value!.min || val > dependentValues.value!.max;
};
// end duplicated logic

const handleCloseModal = () => {
  modalVisible.value = false;
  chosenAxisId.value = "";
};

const handleClickAxis = (axis: Parameter) => {
  // If there is no chosen axis already, set the chosen axis to the one clicked.
  // Otherwise, clicking the same axis again will clear it.
  if (chosenAxisId.value === "") {
    chosenAxisId.value = axis.id;
    // Pre-populate the scenario options input with all options if there aren't more than max
    selectedScenarioOptions.value = nonBaselineOptions.value.length <= MAX_SCENARIOS_COMPARED_TO_BASELINE
      ? nonBaselineOptions.value.map(o => o.id)
      : []; // TODO: (jidea-230) pre-populate country parameter to nearby countries
  } else {
    chosenAxisId.value = "";
    selectedScenarioOptions.value = [];
  }
};

const formInvalid = computed(() => {
  return scenarioSelectionInvalid.value || !chosenParameterAxis.value;
});

watch(selectedScenarioOptions, () => {
  showFormValidationFeedback.value = false;
}, { deep: 1 });

const submitForm = async () => {
  if (formInvalid.value) {
    showFormValidationFeedback.value = true;
    return;
  }

  showFormValidationFeedback.value = false;
  formSubmitting.value = true;

  // TODO: (jidea-262) Start scenario runs
  // TODO: Check that the baseline option does in fact match the currentScenario

  const baselineParameters = appStore.currentScenario.parameters;
  if (chosenParameterAxis.value && baselineParameters) {
    // Record comparison information in URL query parameters, to facilitate link sharing
    await navigateTo({ path: "/comparison", query: {
      ...baselineParameters,
      axis: chosenAxisId.value,
      scenarios: selectedScenarioOptions.value.join(";"),
    } });
  }
};
</script>

<style lang="scss" scoped>
:deep(.modal-dialog) {
  max-width: 40rem;
}

// Copied from v10.0.0 of the VueSelect component
:deep(.multi-value) {
  appearance: none;
  display: flex;
  align-items: center;
  gap: var(--vs-multi-value-gap);
  padding: var(--vs-multi-value-padding);
  margin: var(--vs-multi-value-margin);
  border: 0;
  font-size: var(--vs-multi-value-font-size);
  font-weight: var(--vs-multi-value-font-weight);
  color: var(--vs-multi-value-text-color);
  line-height: var(--vs-multi-value-line-height);
  background: var(--vs-multi-value-bg);
  outline: none;
  cursor: pointer;
}

.multi-value.outside-select {
  margin: 0;
  font-size: inherit;
  --vs-multi-value-padding: 0.25rem 0.4rem;
}

.axis-btn {
  &:hover {
    background-color: white;
    border-color: var(--cui-primary-bg-subtle) !important;
    transition: background-color 0.2s;
    transition: border-color 0.2s;
  }

  .cilx {
    margin-bottom: 0.1rem;
  }
}

#run-button {
  min-width: 9rem;
  align-self: flex-start;
}
</style>
