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
        <div class="d-flex gap-2 flex-wrap">
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
        <div v-if="chosenAxisId && !chosenAxisParameter?.ordered" class="mt-3">
          <div>
            <CFormLabel id="scenarioOptions" for="scenarioOptions" class="fs-5 form-label">
              Compare baseline scenario
              <CTooltip
                content="To change the baseline, exit the overlay and edit the current scenario's parameters."
                placement="top"
                @show="() => { $emit('toggleEditParamsButtonPulse', true) }"
                @hide="turnOffEditParamsButtonPulse(3000);"
              >
                <template #toggler="{ togglerId, on }">
                  <span :aria-describedby="togglerId" class="multi-value d-inline-block outside-select" v-on="on">
                    {{ baselineOption?.label }}
                  </span>
                </template>
              </CTooltip>
              against:
            </CFormLabel>
            <!-- TODO: (jidea-229) For user-provided custom options, consider using displayedOptions prop to control inclusion in menu -->
            <!-- TODO: (jidea-230) For country options, consider using getOptionLabel prop to insert country flag in menu option -->
            <div class="position-relative">
              <VueSelect
                ref="vueSelectComponent"
                v-model="selectedScenarioOptions"
                input-id="scenarioOptions"
                :is-menu-open="selectMenuOpen"
                :aria="{ labelledby: `scenarioOptions`, required: true }"
                class="form-control"
                :class="scenarioSelectionInvalid && showValidationFeedback ? 'is-invalid' : ''"
                :options="scenarioOptions"
                :is-clearable="true"
                :is-multi="true"
                :close-on-select="false"
                :placeholder="`Select up to ${MAX_COMPARISON_SCENARIOS - 1} options to compare against baseline`"
                @menu-opened="selectMenuOpen = true"
                @menu-closed="selectMenuOpen = false"
                @option-selected="hideFeedback"
                @option-deselected="hideFeedback"
              >
                <template #option="{ option }">
                  <div class="parameter-option">
                    <span>{{ option.label }}</span>
                    <div
                      v-if="option.description"
                      class="text-muted"
                    >
                      <small>{{ option.description }}</small>
                    </div>
                  </div>
                </template>
                <template #clear>
                  <span class="text-muted">Clear</span>
                </template>
                <template #no-options>
                  {{ allScenariosSelected ? 'All available scenarios have already been selected.' : 'No options found.' }}
                </template>
              </VueSelect>
              <div v-if="scenarioSelectionInvalid && showValidationFeedback" class="invalid-tooltip">
                {{ scenarioSelectionInvalidFeedback }}
              </div>
            </div>
          </div>
          <div class="d-flex">
            <CButton
              id="run-button"
              color="primary"
              :size="appStore.largeScreen ? 'lg' : undefined"
              type="submit"
              :disabled="formSubmitting"
              class="ms-auto mt-3 align-self-start"
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
import { type Parameter, type ParameterOption, TypeOfParameter } from "~/types/parameterTypes";
import { paramOptsToSelectOpts } from "~/components/utils/parameters";
import VueSelect from "vue3-select-component";

const emit = defineEmits<{
  toggleEditParamsButtonPulse: [on: boolean]
}>();

const appStore = useAppStore();

const MIN_COMPARISON_SCENARIOS = 2;
const MAX_COMPARISON_SCENARIOS = 6;
const VALUE_CONTAINER_SELECTOR = ".value-container.multi";
const SEARCH_INPUT_SELECTOR = "input.search-input";

const modalVisible = ref(false);
const selectMenuOpen = ref(false);
const chosenAxisId = ref("");
const selectedScenarioOptions = ref<string[]>([]);
const formSubmitting = ref(false);
const showValidationFeedback = ref(false);
const pulseOffTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
const vueSelectControl = ref<HTMLElement | null>(null);
const vueSelectComponentRef = useTemplateRef<ComponentPublicInstance>("vueSelectComponent");

const hideFeedback = () => showValidationFeedback.value = false;

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

const tooFewScenariosSelected = computed(() => selectedScenarioOptions.value.length + 1 < MIN_COMPARISON_SCENARIOS);
const tooManyScenariosSelected = computed(() => selectedScenarioOptions.value.length + 1 > MAX_COMPARISON_SCENARIOS);

const scenarioSelectionInvalid = computed(() => {
  const invalid = tooFewScenariosSelected.value || tooManyScenariosSelected.value;
  return invalid;
});

const scenarioSelectionInvalidFeedback = computed(() => {
  if (tooFewScenariosSelected.value) {
    return `Please select at least ${MIN_COMPARISON_SCENARIOS - 1} scenario to compare against the baseline.`;
  } else if (tooManyScenariosSelected.value) {
    return `You can compare up to ${MAX_COMPARISON_SCENARIOS - 1} scenarios against the baseline.`;
  } else {
    return "";
  }
});

const chosenAxisParameter = computed(() => {
  return appStore.metadata?.parameters.find(p => p.id === chosenAxisId.value);
});

const chosenAxisIsNumeric = computed(() => {
  return chosenAxisParameter.value?.parameterType === TypeOfParameter.Numeric;
});

const baselineOption = computed(() => {
  if (!appStore.currentScenario.parameters) {
    return null;
  }

  if (chosenAxisIsNumeric.value) {
    const baselineValue = appStore.currentScenario.parameters[chosenAxisId.value];
    // TODO: (jidea-229) description should say whether the value is a default, min, max; or empty if user-provided.
    // TODO: (jidea-229) For numeric options, do (locale-based) comma-separation of thousands.
    return { id: baselineValue, label: baselineValue, description: "" } as ParameterOption;
  } else {
    return chosenAxisParameter.value?.options?.find((o) => {
      return o.id === appStore.currentScenario.parameters![chosenAxisId.value];
    });
  }
});

const nonBaselineOptions = computed(() => {
  return chosenAxisParameter.value?.options?.filter(o => o.id !== baselineOption.value?.id) || [];
});

const scenarioOptions = computed(() => {
  return paramOptsToSelectOpts(nonBaselineOptions.value);
});

const allScenariosSelected = computed(() => {
  return selectedScenarioOptions.value.length === nonBaselineOptions.value.length;
});

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
  return scenarioSelectionInvalid.value || !chosenAxisParameter.value;
});

const submitForm = async () => {
  if (formInvalid.value) {
    showValidationFeedback.value = true;
    return;
  }

  appStore.downloadError = undefined;
  formSubmitting.value = true;

  // TODO: (jidea-262) Start scenario runs
  // TODO: Check that the baseline option does in fact match the currentScenario

  const baselineParameters = appStore.currentScenario.parameters;
  if (chosenAxisParameter.value && baselineParameters) {
    appStore.setComparison(
      chosenAxisParameter.value.id,
      baselineParameters,
      selectedScenarioOptions.value,
    );

    // Record comparison information in URL query parameters to enable link sharing
    // Those URL query params will need to be validated, since users might type anything into the URL bar: jidea-253
    await navigateTo({ path: "/comparison", query: {
      ...baselineParameters,
      axis: chosenAxisId.value,
      selectedScenarios: selectedScenarioOptions.value,
    } });
  }
};

// If a click is detected in a row-end gap that is created due to flex-wrapping the option tags onto multiple rows,
// treat it as a click on the search input, that is, open the options menu and focus the search input.
const handleClickVueSelectControl = (event: MouseEvent) => {
  // Only do anything if the click was not on any child element
  if (event.target === vueSelectControl.value) {
    vueSelectControl.value?.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR)?.focus();
    selectMenuOpen.value = true;
  }
};

watch(() => vueSelectComponentRef.value, () => {
  const controlEl = vueSelectComponentRef.value?.$el.querySelector(VALUE_CONTAINER_SELECTOR);
  if (controlEl) {
    vueSelectControl.value = controlEl;
    vueSelectControl.value?.addEventListener("click", handleClickVueSelectControl);
  } else {
    vueSelectControl.value?.removeEventListener("click", handleClickVueSelectControl);
  }
});
</script>

<style lang="scss" scoped>
:deep(.modal-dialog) {
  max-width: 40rem;

  --vs-menu-height: max(calc(100dvh - 25rem), 200px); // TODO: make this a sensibly calculated number e.g. page height minus distance to top of page minus margin
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

:deep(.vue-select) {
  .indicators-container .clear-button {
    margin-left: 0.5rem;
    width: unset;

    &:hover {
      opacity: 75%;
    }
  }

  &.open {
    .indicators-container .clear-button {
      display: none;
    }
  }

  &.form-control.is-invalid {
    // Calculate how much the menu needs to be moved down to accommodate the invalid tooltip:
    // = tooltip font size + (2 * tooltip vertical padding) + tooltip margin + form-control bottom padding + arbitrary extra padding
    --vs-menu-offset-top: calc(var(--cui-body-font-size) + (2 * 0.25rem) + 0.1rem + 0.375rem + 0.5rem);
  }

  .search-input::placeholder {
    opacity: 0.5;
  }
}

#run-button {
  min-width: 9rem;
  align-self: flex-start;
}
</style>
