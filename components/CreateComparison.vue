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
            @click="handleChooseAxis(para)"
          >
            <ParameterIcon :parameter="para" />
            <span class="ms-2">{{ para.label }}</span>
            <CIcon v-if="chosenAxisId === para.id" class="text-muted ms-2 cilx" icon="cilX" />
          </CButton>
        </div>
        <div v-if="chosenAxisId && !chosenParameterAxis?.ordered && chosenParameterAxis?.parameterType !== TypeOfParameter.Numeric" class="mt-3">
          <CFormLabel :id="FORM_LABEL_ID" :for="FORM_LABEL_ID" class="fs-5 form-label">
            Compare baseline scenario
            <CTooltip
              content="To change the baseline, exit the overlay and edit the current scenario's parameters."
              placement="top"
              @show="() => { $emit('toggleEditParamsButtonPulse', true) }"
              @hide="turnOffEditParamsButtonPulse(3000);"
            >
              <template #toggler="{ togglerId, on }">
                <!-- TODO: use humanReadableNumber formatter for numeric parameters -->
                <span
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
              :show-feedback="showFeedback"
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
import { MAX_COMPARISON_SCENARIOS } from "~/components/utils/comparisons";
import { useScenarioOptions } from "~/composables/useScenarioOptions";

const emit = defineEmits<{
  toggleEditParamsButtonPulse: [on: boolean]
}>();

const appStore = useAppStore();
const FORM_LABEL_ID = "scenarioOptions";
const selectedScenarioOptions = ref<string[]>([]);
const modalVisible = ref(false);
const chosenAxisId = ref("");
const formSubmitting = ref(false);
const showFeedback = ref(false);
const pulseOffTimer = ref<ReturnType<typeof setTimeout>>();

const chosenParameterAxis = computed(() => appStore.metadata?.parameters.find(p => p.id === chosenAxisId.value));

const { baselineOption, nonBaselineOptions } = useScenarioOptions(chosenParameterAxis);
const { invalid: scenarioSelectionInvalid } = useComparisonValidation(selectedScenarioOptions);

// To prevent race conditions, route all toggling-off through this function, so that only the last-created timer executes.
const turnOffEditParamsButtonPulse = (delay: number) => {
  if (pulseOffTimer.value) {
    clearTimeout(pulseOffTimer.value);
  }
  pulseOffTimer.value = setTimeout(() => {
    emit("toggleEditParamsButtonPulse", false);
  }, delay);
};

const handleCloseModal = () => {
  modalVisible.value = false;
  chosenAxisId.value = "";
  // If 'edit parameters' button is still pulsing, don't stop it until after a couple of seconds,
  // so that user can find it easily.
  turnOffEditParamsButtonPulse(2000);
};

const handleChooseAxis = (axis: Parameter) => {
  if (chosenAxisId.value === "") {
    chosenAxisId.value = axis.id;
    // Pre-populate the scenario options input
    selectedScenarioOptions.value = nonBaselineOptions.value.length + 1 > MAX_COMPARISON_SCENARIOS
      ? [] // TODO: (jidea-230) pre-populate country parameter to nearby countries
      : nonBaselineOptions.value.map(o => o.id);
  } else {
    chosenAxisId.value = "";
    selectedScenarioOptions.value = [];
  }
};

const formInvalid = computed(() => {
  return scenarioSelectionInvalid.value || !chosenParameterAxis.value;
});

watch(selectedScenarioOptions, () => {
  showFeedback.value = false;
}, { deep: 1 });

const submitForm = async () => {
  if (formInvalid.value) {
    showFeedback.value = true;
    return;
  }

  showFeedback.value = false;
  appStore.downloadError = undefined;
  formSubmitting.value = true;

  // TODO: (jidea-262) Start scenario runs
  // TODO: Check that the baseline option does in fact match the currentScenario

  const baselineParameters = appStore.currentScenario.parameters;
  if (chosenParameterAxis.value && baselineParameters) {
    // Record comparison information in URL query parameters, to facilitate link sharing
    await navigateTo({ path: "/comparison", query: {
      ...baselineParameters,
      axis: chosenAxisId.value,
      selectedScenarios: selectedScenarioOptions.value,
    } });
  }
};
</script>

<style lang="scss" scoped>
:deep(.modal-dialog) {
  max-width: 40rem;
}

.multi-value.outside-select {
  margin: 0;
  font-size: inherit;

  // Below values copied from Vue 3 Select Component
  appearance: none;
  display: flex;
  align-items: center;
  gap: var(--vs-multi-value-gap);
  padding: var(--vs-multi-value-padding);
  border: 0;
  font-weight: var(--vs-multi-value-font-weight);
  color: var(--vs-multi-value-text-color);
  line-height: var(--vs-multi-value-line-height);
  background: var(--vs-multi-value-bg);
  outline: none;
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
