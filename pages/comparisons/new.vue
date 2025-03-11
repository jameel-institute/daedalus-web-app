<template>
  <div>
    <div :class="`overlay ${appStore.largeScreen ? 'large-screen' : ''}`">
      <div id="previousScenario" v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card parameters-card ms-auto">
        <CCol class="col-auto">
          <div class="card-footer h-100 align-content-center" style="border-top: 0; border-right: 0; border-bottom: 0">
            {{ chosenParamId === '' ? 'Previous scenario' : 'Other parameters' }}
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
      <h3>Compare scenarios</h3>
      <p>
        Which parameter would you like to explore?
      </p>
      <!-- Could do drop down, but that requires another click to open the dropdown. -->
      <div class="d-flex gap-2 flex-wrap">
        <CButton
          v-for="para in appStore.metadata?.parameters"
          :key="para.id"
          :disabled="chosenParamId !== '' && chosenParamId !== para.id"
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
      <div v-if="chosenParamId">
        <CFormLabel class="mt-3">
          Choose which {{ chosenParam?.label.toLocaleLowerCase() }} scenarios to include in comparison
        </CFormLabel>
        <VueSelect
          v-if="paramOptions"
          v-model="selectedOptions"
          :options="paramOptions"
          placeholder="Select an option"
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
        <div class="d-flex">
          <CButton
            id="run-button"
            color="primary"
            :size="appStore.largeScreen ? 'lg' : undefined"
            type="submit"
            class="mt-3 ms-auto"
            :disabled="selectedOptions.length === 0"
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
import type { Parameter } from "~/types/parameterTypes";
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
const paramOptions = computed(() => chosenParam.value?.options?.map(o => ({ value: o.id, label: o.label, description: o.description })));
const selectedOptions = ref([]);

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
  right: -78rem;
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
