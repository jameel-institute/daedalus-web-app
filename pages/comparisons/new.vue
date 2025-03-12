<template>
  <div>
    <div :class="`overlay ${appStore.largeScreen ? 'large-screen' : ''}`">
      <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" id="previousScenario" class="card horizontal-card parameters-card ms-auto">
        <CCol class="col-auto">
          <div class="card-footer h-100 align-content-center d-flex" style="border-top: 0; border-right: 0; border-bottom: 0">
            <span class="fs- pt-2">Fixed parameters (baseline scenario)</span>
            <div class="ms-auto">
              <EditParameters />
            </div>
          </div>
        </CCol>
        <CCol class="col-sm">
          <div class="card-body py-2 border-top">
            <p class="card-text d-flex gap-3 flex-wrap">
              <CTooltip
                v-for="(parameter) in appStore.metadata?.parameters.filter((p) => p.id !== chosenParamId)"
                :key="parameter.id"
                :content="parameter.label"
                placement="top"
              >
                <template #toggler="{ id, on }">
                  <span
                    :aria-describedby="id"
                    v-on="on"
                  >
                    <ParameterIcon :parameter="parameter" />
                    <span class="ms-1">
                      {{ paramDisplayText(parameter) }}
                    </span>
                    <CIcon v-if="parameter.id === appStore.globeParameter?.id && countryFlagIcon" :icon="countryFlagIcon" class="parameter-icon text-secondary ms-1" />
                  </span>
                </template>
              </CTooltip>
            </p>
          </div>
        </CCol>
      </div>
      <div class="d-flex">
        <CIconSvg class="icon me-2" style="height: 1.3rem; width: 1.3rem; margin-top: 0.2rem;">
          <img src="/icons/axis-black.png">
        </CIconSvg>
        <h3>Compare scenarios</h3>
      </div>
      <CFormLabel class="fs-5">
        Which parameter would you like to explore?
      </CFormLabel>
      <!-- Could do drop down, but that requires another click to open the dropdown. -->
      <div class="d-flex gap-2 flex-wrap">
        <CButton
          v-for="para in appStore.metadata?.parameters.filter((p) => chosenParamId === '' || chosenParamId === p.id)"
          :key="para.id"
          href="#"
          color="light"
          variant="outline"
          style="color: black; border-color: var(--cui-border-color); background-color: white;"
          @click.prevent="(e) => { e.preventDefault(); chosenParamId = chosenParamId === '' ? para.id : ''; }"
        >
          <ParameterIcon :parameter="para" />
          <span class="ms-2">{{ para.label }}</span>
          <span v-if="chosenParamId === para.id" id="closeX" class="text-secondary ms-2">
            <CIcon icon="cilX" />
          </span>
        </CButton>
      </div>
      <!-- TODO: make input initialise with option from baseline scenario pre-selected. -->
      <div v-if="chosenParamId">
        <CFormLabel v-if="chosenParamId === 'hospital_capacity'" class="mt-3 fs-5">
          Choose which {{ chosenParam?.label.toLocaleLowerCase() }} scenarios to include in the comparison. You can choose from the presets or add a custom option.
        </CFormLabel>
        <CFormLabel v-else-if="chosenParamId === 'country'" class="mt-3 fs-5">
          Choose which countries to include in the comparison. You can select from the dropdown or by clicking on the map.
        </CFormLabel>
        <CFormLabel v-else class="mt-3 fs-5">
          Choose which {{ chosenParam?.label.toLocaleLowerCase() }} scenarios to include in comparison
        </CFormLabel>
        <VueSelect
          v-if="paramOptions"
          v-model="selectedOptions"
          :options="paramOptions"
          placeholder="Select options"
          :is-multi="true"
          :is-clearable="false"
        >
          <template #option="{ option }">
            <div class="parameter-option">
              <span>{{ option.label }}</span>
              <div
                v-if="option.description"
                class="text-secondary"
              >
                <small>{{ option.description }}</small>
              </div>
            </div>
          </template>
        </VueSelect>
        <div v-if="chosenParamId === 'hospital_capacity'" class="mt-3">
          <!-- <p>How it looks when you type in your own option</p>
          <img src="~assets/img/vue3select multiple select taggable.png" height="100px"> -->
          <CFormLabel class="mt-3">
            Add a custom {{ chosenParam?.label.toLocaleLowerCase() }} option
          </CFormLabel>
          <div class="d-flex flex-wrap">
            <CButton
              style="border: none; position: relative; top: 0rem;"
              type="button"
              color="primary"
              shape="rounded-pill"
              class="btn-sm px-3 ms-2 align-self-start pt-2"
              :title="`Add new custom ${chosenParam?.label?.toLowerCase()} option`"
              :disabled="newCustomOption === unitedKingdomValues.default.toString()"
              @click="() => { userProvidedNumericOptions.push(Number(newCustomOption)); addToSelected(newCustomOption) /* selectedOptions.push(newCustomOption) */ }"
            >
              <span class="me-2 position-relative" style="top: -0.2rem;">Add</span>
              <CIcon icon="cilPlus" size="lg" />
            </CButton>
            <CButton
              style="border: none;"
              type="button"
              color="secondary"
              variant="ghost"
              shape="rounded-pill"
              :class="`${newCustomOption === unitedKingdomValues.default.toString() ? 'invisible' : ''} btn-sm mx-2 align-self-start`"
              :aria-label="`Reset new ${chosenParam?.label?.toLowerCase()} to default`"
              :title="`Reset new ${chosenParam?.label?.toLowerCase()} to default`"
              @click="() => { newCustomOption = unitedKingdomValues.default.toString() }"
            >
              <CIcon icon="cilActionUndo" size="sm" />
            </CButton>
            <div class="flex-grow-1">
              <CFormInput
                :id="chosenParamId"
                v-model="newCustomOption"
                type="number"
                :min="unitedKingdomValues.min"
                :max="unitedKingdomValues.max"
                :step="100"
                :size="undefined"
                :tooltip-feedback="true"
              />
              <CFormRange
                :id="chosenParamId"
                v-model="newCustomOption"
                :min="unitedKingdomValues.min"
                :max="unitedKingdomValues.max"
                :step="100"
              />
            </div>
          </div>
        </div>
        <div class="d-flex">
          <CButton
            id="run-button"
            color="primary"
            :size="appStore.largeScreen ? 'lg' : undefined"
            type="submit"
            class="mt-3 ms-auto"
            :disabled="selectedOptions.length < 2"
          >
            Compare
            <CIcon icon="cilArrowRight" />
          </CButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Parameter, ValueData } from "~/types/parameterTypes";
import getCountryISO2 from "country-iso-3-to-2";
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";

const appStore = useAppStore();

const countryFlagIcon = computed(() => {
  const countryISO3 = appStore.currentScenario?.parameters?.country;
  const countryISO2 = getCountryISO2(countryISO3);
  const titleCaseISO2 = countryISO2?.toLowerCase().replace(/^(.)/, match => match.toUpperCase());
  return countryISO2 ? `cif${titleCaseISO2}` : "";
});
const chosenParamId = ref("");
const chosenParam = computed(() => appStore.metadata?.parameters.find(p => p.id === chosenParamId.value));

const unitedKingdomValues = ref<ValueData>({
  min: 23600,
  default: 26200,
  max: 34100,
});
const newCustomOption = ref(unitedKingdomValues.value.default.toString());
const userProvidedNumericOptions = ref<number[]>([]);

const paramOptions = computed(() => {
  if (chosenParamId.value !== "hospital_capacity") {
    return chosenParam.value?.options?.map(o => ({ value: o.id, label: o.label, description: o.description }));
  } else {
    const options = [];
    options.push({ value: unitedKingdomValues.value.min, label: unitedKingdomValues.value.min.toString(), description: "Minimum value for United Kingdom" });
    options.push({ value: unitedKingdomValues.value.default, label: unitedKingdomValues.value.default.toString(), description: "Default value for United Kingdom" });
    options.push({ value: unitedKingdomValues.value.max, label: unitedKingdomValues.value.max, description: "Maximum value for United Kingdom" });

    userProvidedNumericOptions.value.forEach((o) => {
      options.push({ value: o, label: o.toString(), description: "Custom value" });
    });

    return options.sort((a, b) => a.value - b.value);
  }
});
const selectedOptions = ref<any[]>([]);

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario?.parameters && appStore.currentScenario?.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();

    const rawValIsNumberString = Number.parseInt(rawVal).toString() === rawVal;
    if (rawValIsNumberString) {
      // TODO: Localize number formatting.
      return new Intl.NumberFormat().format(Number.parseInt(rawVal));
    }
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

const addToSelected = (custom: string) => {
  console.log(selectedOptions.value);
  selectedOptions.value.push(Number(custom));
  console.log(selectedOptions.value);
};

watch(() => chosenParamId.value, () => {
  if (chosenParamId.value === "country") {
    appStore.globe.interactive = true;
  }
});

onMounted(() => {
  appStore.globe.interactive = false;

  // Reset the globe (not the form) and don't highlight any countries, implying that the user can start fresh.
  appStore.globe.highlightedCountry = null;

  appStore.currentScenario = {
    runId: undefined,
    parameters: {
      country: "GBR",
      pathogen: "sars_cov_1",
      response: "none",
      vaccine: "none",
      hospital_capacity: "30500",
    },
    result: {
      data: undefined,
      fetchError: undefined,
      fetchStatus: undefined,
    },
    status: {
      data: undefined,
      fetchError: undefined,
      fetchStatus: undefined,
    },
  };
});
</script>

<style lang="scss">
@use "sass:color";

#previousScenario {
  position: absolute;
  right: -50rem;
}

.overlay {
  z-index: 1;
  position: relative;
  padding: 1rem;
  max-width: 50%;
}

.overlay::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.5rem;
  background-color: rgba(
    color.channel($cui-tertiary-bg, "red", $space: rgb),
    color.channel($cui-tertiary-bg, "green", $space: rgb),
    color.channel($cui-tertiary-bg, "blue", $space: rgb),
    0.8);
  mix-blend-mode: color-burn;
  pointer-events: none;
}

.overlay.large-screen::before {
  box-shadow: var(--cui-box-shadow);
}

// From parameterform.vue, but adapted
.vue-select {
  --vs-font-size: 1rem !important;
  // --vs-input-outline: transparent;
  --vs-border-radius: 4px;
  --vs-line-height: 0.9;
  --vs-menu-height: 450px;
  // --vs-padding: 0;
  --vs-option-font-size: var(--vs-font-size);
  --vs-option-text-color: var(--vs-text-color);
  --vs-option-hover-color: var(--cui-tertiary-bg);
  --vs-option-focused-color: var(--vs-option-hover-color);
  --vs-option-selected-color: var(--cui-primary-bg-subtle);
  --vs-option-padding: 8px;
}
.vue-select  {
  border-radius: 1rem!important;

  .control {
    min-height: unset !important;
  }
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

.value-container.multi button.multi-value {
  background-color: var(--cui-primary-bg-subtle);
  border-radius: 0.5rem;
  color: var(--cui-primary);
  padding: 0.25rem 0.5rem;
  padding-right: 0.175rem;

  svg {
    opacity: 0.5;
    fill: var(--cui-primary);
    margin-left: 0.2rem;
  }
}
</style>
