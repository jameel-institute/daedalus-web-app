<template>
  <div id="resultsPage">
    <div class="d-flex flex-wrap mb-3 gap-3">
      <h1 class="fs-2 mb-0 pt-1">
        Results {{ chosenAxis }}
      </h1>
      <div class="d-inline-block ms-auto">
        <CButton
          color="primary"
          style="padding-bottom: 0.1rem;
            height: 2.6rem;
            border: 1px solid rgba(8, 10, 12, 0.17)!important;
            border-radius: 0.375rem;"
          @click="() => { navigateTo('/comparisons/new') }"
        >
          <CIconSvg class="icon m-0 p-0" style="height: 1.2rem; width: 1.2rem;">
            <img src="/icons/axes-white.png"> <!-- Source: https://www.flaticon.com/free-icon/arrows_10436878?term=axis&page=1&position=9&origin=tag&related_id=10436878 -->
          </CIconSvg>
          <span class="ms-2">Compare against other scenarios</span>
        </CButton>
      </div>
      <CModal
        v-if="chosenAxis === ''"
        :visible="modalVisible && chosenAxis === ''"
        aria-labelledby="modalTitle"
        @close="() => { modalVisible = false; chosenAxis = ''; }"
      >
        <CModalHeader>
          <CModalTitle id="modalTitle" class="mb-0 mt-1">
            Compare scenarios
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Which parameter would you like to explore?
          </p>
          <CDropdown>
            <CDropdownToggle color="primary">
              Select parameter
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownHeader>
                Parameters
              </CDropdownHeader>
              <a
                v-for="para in appStore.metadata?.parameters"
                :key="para.id"
                href="#"
                class="dropdown-item py-2"
                @click.prevent="(e) => { e.preventDefault(); chosenAxis = para.id; }"
              >
                <ParameterIcon :parameter="para" />
                <span class="ms-2">{{ para.label }}</span>
              </a>
            </CDropdownMenu>
          </CDropdown>
        </CModalBody>
      </CModal>
      <CModal
        v-show="chosenAxis !== ''"
        :visible="chosenAxis !== ''"
        aria-labelledby="pTitle"
        @close="() => { modalVisible = false; chosenAxis = ''; }"
      >
        <CModalHeader>
          <CModalTitle id="pTitle" class="mb-0 mt-1">
            Compare scenarios by {{ chosenAxisParam?.label?.toLowerCase() }}
          </CModalTitle>
        </CModalHeader>
        <CModalBody v-if="chosenAxis === 'country'">
          <p>Choose country</p>
        </CModalBody>
        <CModalBody v-if="chosenAxis === 'pathogen'">
          <VueSelect
            v-if="axisParamOptions"
            :model-value="chosenAxisParam?.defaultOption"
            class="form-control"
            :options="axisParamOptions"
            :is-multi="true"
            :close-on-select="false"
            :is-clearable="false"
          >
            <template #option="{ option }">
              <div class="parameter-option">
                <span>{{ option.label }}</span>
                <div
                  v-if="option.description"
                >
                  <small>{{ option.description }}</small>
                </div>
              </div>
            </template>
          </VueSelect>
        </CModalBody>
        <CModalBody v-if="chosenAxis === 'response'">
          <p>Choose responsseee</p>
        </CModalBody>
        <CModalBody v-if="chosenAxis === 'vaccine'">

        </CModalBody>
        <CModalBody v-if="chosenAxis === 'hospital_capacity'">

        </CModalBody>
      </CModal>
      <DownloadExcel />
      <CodeSnippet />
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl">
          <img src="/icons/rotate-device.svg">
          <!-- License: MIT License https://www.svgrepo.com/svg/451262/rotate-device -->
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
      <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card parameters-card">
        <CRow>
          <div
            v-show="!appStore.largeScreen"
            class="card-header h-100 align-content-center"
          >
            <EditParameters />
          </div>
          <CCol class="col-sm">
            <div class="card-body py-2">
              <p class="card-text d-flex gap-3 flex-wrap">
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
          </CCol>
          <CCol v-show="appStore.largeScreen" class="col-auto">
            <div class="card-footer h-100 align-content-center">
              <EditParameters />
            </div>
          </CCol>
        </CRow>
      </div>
    </div>
    <CSpinner v-show="showSpinner" class="ms-3 mb-3 mt-3" />
    <CAlert v-if="appStore.currentScenario.status.data?.runSuccess === false" color="danger">
      The analysis run failed. Please
      <NuxtLink prefetch-on="interaction" to="/scenarios/new">
        <span>try again</span>
      </NuxtLink>.
      <p v-for="(errorMsg, index) in appStore.currentScenario.status.data.runErrors" :key="index">
        {{ errorMsg }}
      </p>
    </CAlert>
    <CAlert
      v-if="!appStore.timeSeriesData && jobSlow && appStore.currentScenario.status.data?.runStatus"
      :color="jobReallySlow ? 'warning' : 'info'"
    >
      <p v-if="jobReallySlow">
        Thank you for waiting. Some scenario analyses can take up to 60 seconds to run. You can carry on waiting or
        <NuxtLink prefetch-on="interaction" to="/scenarios/new">
          <span> try again</span>
        </NuxtLink> with another run.
      </p>
      <p>
        Analysis status: {{ appStore.currentScenario.status.data?.runStatus }}
      </p>
      <p class="mb-0">
        Waiting for {{ secondsSinceFirstStatusPoll }} seconds
      </p>
    </CAlert>
    <CRow v-else-if="appStore.currentScenario.result.data" class="results-cards-container">
      <div class="col-12 col-xl-6">
        <CostsCard />
      </div>
      <div class="col-12 col-xl-6">
        <TimeSeriesCard />
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import getCountryISO2 from "country-iso-3-to-2";
import VueSelect from "vue3-select-component";
import type { Parameter } from "~/types/parameterTypes";

const appStore = useAppStore();

let statusInterval: NodeJS.Timeout;
const jobSlow = ref(false);
const jobReallySlow = ref(false);
const secondsSinceFirstStatusPoll = ref("0");
const showSpinner = computed(() => !appStore.currentScenario.result.data
  && appStore.currentScenario.status.data?.runSuccess !== false
  && appStore.currentScenario.runId,
);
const modalVisible = ref(false);
const chosenAxis = ref("");

const chosenAxisParam = computed(() => appStore.metadata?.parameters.find((p) => p.id === chosenAxis.value));
const axisParamOptions = computed(() => chosenAxisParam.value?.options?.map((o) => ({ value: o.id, label: o.label, description: o.description })));

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

const route = useRoute();
const runIdFromRoute = route.params.runId as string;
if (appStore.currentScenario.runId && runIdFromRoute !== appStore.currentScenario.runId) {
  appStore.clearScenario(); // Required so that previous parameters aren't hanging around in the store.
}
appStore.currentScenario.runId = runIdFromRoute;

const countryFlagIcon = computed(() => {
  const countryISO3 = appStore.currentScenario?.parameters?.country;
  const countryISO2 = getCountryISO2(countryISO3);
  const titleCaseISO2 = countryISO2?.toLowerCase().replace(/^(.)/, match => match.toUpperCase());
  return countryISO2 ? `cif${titleCaseISO2}` : "";
});

// Use useAsyncData to store the time once, during server-side rendering: avoids client render re-writing value.
const { data: timeOfFirstStatusPoll } = await useAsyncData<number>("timeOfFirstStatusPoll", async () => {
  return new Promise<number>((resolve) => {
    resolve(new Date().getTime());
  });
});

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.loadScenarioStatus();
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResult();
}

watch(() => appStore.currentScenario.status.data?.runSuccess, (runSuccess) => {
  if (runSuccess) {
    appStore.loadScenarioResult();
  }
});

watch(() => appStore.currentScenario.status.data?.done, (done) => {
  if (done) {
    clearInterval(statusInterval);
    jobSlow.value = false;
    jobReallySlow.value = false;
  }
});

const pollForStatusEveryNSeconds = (seconds: number) => {
  statusInterval = setInterval(() => {
    if (timeOfFirstStatusPoll.value) {
      secondsSinceFirstStatusPoll.value = ((new Date().getTime() - timeOfFirstStatusPoll.value) / 1000).toFixed(0);
    };
    appStore.loadScenarioStatus();
  }, seconds * 1000);
};

onMounted(() => {
  appStore.globe.interactive = false;

  if (!appStore.currentScenario.status.data?.done && appStore.currentScenario.runId) {
    pollForStatusEveryNSeconds(0.2);
    setTimeout(() => {
      // If the job isn't completed within a few seconds, give user the information about the run status.
      if (!appStore.currentScenario.status.data?.done) {
        jobSlow.value = true;
      }
    }, 5000);
    // Some runs take an especially long time, e.g. Singapore + Omicron.
    setTimeout(() => {
      if (!appStore.currentScenario.status.data?.done) {
        jobReallySlow.value = true;
      }
    }, 15000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss">
.results-cards-container {
  row-gap: 1rem;
}

#resultsPage {
  .card {
    background: rgba(255, 255, 255, 0.5);

    &.horizontal-card {
      height: fit-content;

      .card-header {
        padding: 0;
      }

      .card-footer {
        border-left: var(--cui-card-border-width) solid var(--cui-card-border-color); // copied from .card-header border-bottom
        border-top: none;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: var(--cui-card-inner-border-radius) var(--cui-card-inner-border-radius) 0 0;

        padding-bottom: 0;
        padding-left: 0;
        padding-top: 0;
      }

      .row {
        --cui-gutter-y: 0;
        --cui-gutter-x: 0;
      }
    }

    &.parameters-card {
      .btn-check:checked + .btn, :not(.btn-check) + .btn:active, .btn:first-child:active, .btn.active, .btn.show {
        background-color: var(--cui-btn-color); // Overrides a style in _theme.scss
      }
    }
  }

  .chart-header {
    height: fit-content;
  }
}
</style>
