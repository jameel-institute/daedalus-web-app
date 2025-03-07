<template>
  <CHeader class="header-sticky p-0" :class="{ 'shadow-sm': isScrolled }">
    <CContainer id="headerNavContainer" fluid class="border-bottom mt-1 justify-content-between">
      <div class="d-flex">
        <CHeaderToggler class="d-lg-none" @click="$emit('toggleSidebarVisibility')">
          <span data-testid="toggle-sidebar-button">
            <CIcon icon="cilMenu" size="lg" />
          </span>
        </CHeaderToggler>
        <div class="header-brand px-2">
          <NuxtLink prefetch-on="interaction" to="/" class="nav-link">
            <CIcon icon="cilGlobeAlt" size="lg" />
            <span id="appTitle">DAEDALUS Explore</span>
          </NuxtLink>
        </div>
      </div>
      <CHeaderNav :class="showControlPanelLabels ? 'show-control-panel-labels' : ''">
        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75" />
        </li>
        <CDropdown variant="nav-item" :auto-close="false">
          <CDropdownToggle :nav-link="false">
            <span v-if="showControlPanelLabels" class="me-2">Comparison</span>
            <CIcon icon="cilBalanceScale" :size="showControlPanelLabels ? 'lg' : 'xl'" />
          </CDropdownToggle>
          <CDropdownMenu :class="dropdownMenuClass">
            <CDropdownHeader>Comparison settings</CDropdownHeader>
            <!-- <p class="mb-0 pb-0">Exploring:</p> -->
            <p class="boldy mb-0">
              <ParameterIcon :parameter="vaccineParam" />
              <span class="ms-2 fs-5">{{ vaccineParam?.label }}</span>
            </p>
            <p class="mb-0 mt-0 pt-0">{{ vaccineParam?.description?.replace("Select a", "You are currently varying the") }}.</p>
            <CDropdownDivider class="mx-3" />
            <div class="d-flex justify-between align-items-center pe-3">
              <CFormLabel id="axis-label" for="axis">
                Explore another parameter:
              </CFormLabel>
              <!-- <TooltipHelp help-text="Choose a parameter to vary." :classes="['smaller-icon', 'ms-auto']" /> -->
            </div>
            <p>TODO: This needs to be a side-dropdown (a drop-side), not a select, since it should link to a modal or page.</p>
            <VueSelect
              model-value="vaccine"
              input-id="axis"
              :aria="{ labelledby: `axis-label`, required: true }"
              class="form-control axis-select side-style ps-3"
              :options="appStore.metadata?.parameters?.filter((p) => p.id !== vaccineParam.id).map((p) => ({ value: p.id, label: p.label, metadata: p }))"
              :is-clearable="false"
            >
              <template #option="{ option }">
                <div class="parameter-option">
                  <ParameterIcon :parameter="option.metadata" />
                  <span class="ms-2">{{ option.label }}</span>
                </div>
              </template>
            </VueSelect>
            <p class="mb-0 mt-2">Selecting another parameter to explore by will keep the baseline scenario the same, and generate different scenarios to compare it against. These will match the baseline scenario in all parameters except the one you choose to vary.</p>
            <CDropdownDivider class="mx-3" />
            <div class="ms-3 pt-2">
              <CFormSwitch
                checked
                id="diffValues"
                label="Display values as relative differences from baseline (hides baseline)"
              />
            </div>
          </CDropdownMenu>
        </CDropdown>
        <CDropdown variant="nav-item" :auto-close="false">
          <CDropdownToggle :nav-link="false">
            <span v-if="showControlPanelLabels" class="me-2">Scenarios</span>
            <CIcon icon="cilLayers" :size="showControlPanelLabels ? 'lg' : 'xl'" />
          </CDropdownToggle>
          <CDropdownMenu :class="dropdownMenuClass">
            <CDropdownHeader>Scenario settings</CDropdownHeader>
            <div v-if="vaccineParam && vaccineParam.options">
              <CFormLabel class="mb-1 ps-3">Scenarios to include in comparison:</CFormLabel>
              <!-- <div class="d-flex pe-1 ps-3"> -->
              <!-- <ParameterHeader :parameter="vaccineParam" :hide-icon="true" /> -->
              <!-- </div> -->
              <VueSelect
                v-model="includedScenarios"
                input-id="inclusion"
                :aria="{ labelledby: `inclusion-label`, required: true }"
                class="form-control scenario-select"
                :options="vaccineParam.options.map((o) => ({ value: o.id, label: o.label, description: o.description }))"
                :close-on-select="false"
                :is-clearable="false"
                :is-multi="true"
              >
                <template #option="{ option }">
                  <div class="parameter-option">
                    <span>{{ option.label }}</span>
                    <div
                      v-if="option.description"
                      :class="option.value === baselineOptionId ? 'text-dark' : 'text-secondary'"
                    >
                      <small>{{ option.description }}</small>
                    </div>
                  </div>
                </template>
              </VueSelect>
            </div>
            <p class="mb-0 mt-2">You can go to an individual scenario's results page by excluding all other scenarios from the comparison.</p>
            <!-- <CFormLabel id="axis-label" for="axis">
              Include:
            </CFormLabel>
            <div
              v-for="option in vaccineParam.options"
              :key="option.id"
            >
              <CFormCheck
                :id="option.id"
                :value="option.id"
                :label="option.label"
              />
              <p class="small">
                {{ option.description }}
              </p>
            </div> -->
          </CDropdownMenu>
        </CDropdown>
        <CDropdown variant="nav-item" :auto-close="false">
          <CDropdownToggle :nav-link="false">
            <span v-if="showControlPanelLabels" class="me-2">Baseline</span>
            <CIcon icon="cilVerticalAlignCenter" :size="showControlPanelLabels ? 'lg' : 'xl'" />
          </CDropdownToggle>
          <CDropdownMenu :class="dropdownMenuClass">
            <CDropdownHeader>Baseline scenario settings</CDropdownHeader>
            <div class="ps-3">
              <p class="ps-0 mb-0">Set a different scenario as the baseline.</p>
              <ParameterIcon :parameter="vaccineParam" />
              <CFormLabel class="small ps-2">
                {{ vaccineParam?.label }}
              </CFormLabel>
              <VueSelect
                v-model="baselineOptionId"
                input-id="baseline"
                :aria="{ labelledby: `baseline-label`, required: true }"
                class="form-control scenario-select side-style ps-0"
                :options="vaccineParam?.options?.map((o) => ({ value: o.id, label: o.label, description: o.description }))"
                :is-clearable="false"
              >
                <template #option="{ option }">
                  <div class="parameter-option">
                    <span>{{ option.label }}</span>
                    <div
                      v-if="option.description"
                      :class="option.value === baselineOptionId ? 'text-dark' : 'text-secondary'"
                    >
                      <small>{{ option.description }}</small>
                    </div>
                  </div>
                </template>
              </VueSelect>
            </div>
            <CDropdownDivider class="mx-3 mt-3" />
            <div v-if="vaccineParam && vaccineParam.options" class="mb-1 ps-3 pt-2">
              <h6 class="ps-0 pb-0 mb-2">Current baseline</h6>
              <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters">
                <p class="d-flex gap-3 flex-wrap ps-0">
                  <CTooltip
                    v-for="(parameter) in appStore.metadata?.parameters"
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
            </div>
            <div class="ms-3">
              <CFormSwitch
                checked
                id="highlightBaseline"
                label="Highlight baseline scenario in plots"
              />
            </div>
          </CDropdownMenu>
        </CDropdown>
        <CDropdown variant="nav-item" :auto-close="false">
          <CDropdownToggle :nav-link="false">
            <span v-if="showControlPanelLabels" class="me-2">Parameters</span>
            <CIcon icon="cilEqualizer" :size="showControlPanelLabels ? 'lg' : 'xl'" />
          </CDropdownToggle>
          <CDropdownMenu :class="dropdownMenuClass">
            <CDropdownHeader>Parameter settings</CDropdownHeader>
            <p class="ps-3 mb-0">
              Below are the parameters which are held constant across all scenarios under comparison. Changing a parameter value here will update all current scenarios.
            </p>
            <CDropdownDivider class="mx-3" />
            <div class="ps-3 pe-3 pt-3">
              <ParameterForm :in-modal="true" />
            </div>
          </CDropdownMenu>
        </CDropdown>
        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75" />
        </li>
      </CHeaderNav>
      <div class="d-none d-sm-block">
        <img
          data-testid="ji-logo-header"
          style="width: 150px;"
          class="img-fluid"
          src="~/assets/img/IMPERIAL_JAMEEL_INSTITUTE_LOCKUP-p-500.png"
          alt="Imperial College and Community Jameel logo"
        >
      </div>
    </CContainer>
  </CHeader>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";
import throttle from "lodash.throttle";
import getCountryISO2 from "country-iso-3-to-2";
import type { Parameter } from "~/types/parameterTypes";

defineEmits<{
  toggleSidebarVisibility: []
}>();

const appStore = useAppStore();
const showControlPanelLabels = ref(true);
const baselineOptionId = ref("low");
const vaccineParam = computed(() => appStore.metadata?.parameters.find(p => p.id === "vaccine"));
const allVaccineScenarios = computed(() => vaccineParam.value?.options?.map(o => o.id));

const includedScenarios = ref<string[]>(allVaccineScenarios.value ?? []);

const allScenariosAreIncluded = computed(() => {
  return includedScenarios.value.length === allVaccineScenarios.value?.length;
});

const dropdownMenuClass = computed(() => showControlPanelLabels.value ? "when-long-panel" : "when-short-panel");

// Lifted from [runId].vue
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
// Lifted from [runId].vue
const countryFlagIcon = computed(() => {
  const countryISO3 = appStore.currentScenario?.parameters?.country;
  const countryISO2 = getCountryISO2(countryISO3);
  const titleCaseISO2 = countryISO2?.toLowerCase().replace(/^(.)/, match => match.toUpperCase());
  return countryISO2 ? `cif${titleCaseISO2}` : "";
});

// We apply a shadow to the header when the position is scrolled down
const isScrolled = ref(false);
const handleScroll = throttle(() => {
  isScrolled.value = document.documentElement.scrollTop > 0;
}, 100);

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss">
@use "sass:map";

$dropdown-menu-width: 23rem;

.boldy {
  font-weight: 500;
  color: $imperial-navy-blue;
}

.header-brand {
  color: $primary;

  .icon {
    position: relative;
    top: 0.1rem;
  }
}
.header {
  margin-bottom: $app-header-margin-bottom;
}
.header-toggler {
  margin-inline-start: -14px;
}
// Align sidebar toggler with sidebar icons
#headerNavContainer {
  padding-left: 1.5rem;
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    padding-left: 0.9rem;
  }
  @media (max-width: map.get($grid-breakpoints, 'lg')) {
    border-bottom-color: rgb(235, 238, 245) !important;
  }
}
#appTitle {
  margin-left: 0.75rem;
}
.header-nav {
  .btn.show, .btn:active {
    background-color: transparent;
    border-color: transparent;
  }

  .dropdown-menu {
    min-width: $dropdown-menu-width;

    &.when-short-panel {
      transform: translate(-8.5rem, 2.5rem) !important;
    }

    &.when-long-panel {
      transform: translate(-7rem, 2.5rem) !important;
    }
  }

  .dropdown-toggle.show {
    // border: var(--cui-border-width) var(--cui-border-style) var(--cui-border-color) !important;
    // border-bottom: none !important;
    // border-bottom-right-radius: 0 !important;
    // border-bottom-left-radius: 0 !important;
    background-color: $cui-tertiary-bg;
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

    &.side-style {
      .menu {
        left: $dropdown-menu-width !important;
        top: -4rem !important;
        --vs-menu-border: var(--cui-border-width) var(--cui-border-style) var(--cui-border-color);
        box-shadow: var(--cui-box-shadow-sm);
      }

      &.open .dropdown-icon svg {
        transform: rotate(90deg) translate(-2px, 0);
      }
    }

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
}
.dropdown-menu {
  p, #axis-label {
    padding: var(--cui-dropdown-header-padding-y) var(--cui-dropdown-header-padding-x);
  }

  .form-check:not(.form-switch) {
    padding: 0 calc(3 * var(--cui-dropdown-header-padding-x));
  }

  #axis-label {
    margin: 0;
  }
}
.show-control-panel-labels {
  .dropdown-header {
    display: none;
  }
}
.header-nav .dropdown-header {
  // background-color: $cui-tertiary-bg;
  // // font-size: 1.1rem;
  // margin-top: -0.5rem;
  // padding-left: calc(2 * var(--cui-dropdown-header-padding-x));
  // padding-top: 0;
}
.axis-select, .scenario-select {
  border: none;
  padding: 0 0.75rem;
}
</style>
