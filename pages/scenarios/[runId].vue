<template>
  <div id="resultsPage">
    <div class="d-flex gap-3">
      <h1 class="fs-4 mb-0 pt-1" style="min-width: 500px">
        Exploring outcomes by global vaccine investment
      </h1>
      <p class="text-muted small d-inline-block">
        Mockup variants available: (0) grid/nongrid (1) settings inside time series card header ("outside-time-series-card"), (2) all lines colored, (3) diffingAgainstBaseline/not. Mockup variants needed: [? version with no highlighted baseline ?]
      </p>
      <DownloadExcel />
      <CodeSnippet />
      <div class="d-inline-block">
        <div>
          <CButton
            color="light"
            class="btn-scenario-header"
          >
            <CIcon icon="cilShare" size="lg" class="text-secondary" />
          </CButton>
        </div>
      </div>
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl">
          <img src="/icons/rotate-device.svg">
          <!-- License: MIT License https://www.svgrepo.com/svg/451262/rotate-device -->
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
      <!-- <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card parameters-card">
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
      </div> -->
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
      <div class="col-12">
        <CTabs activeItemKey="costs">
          <CTabList variant="tabs">
            <CTab itemKey="home" class="ms-3">Overview</CTab>
            <CTab itemKey="costs" class="d-flex align-items-center card-header px-4">
              <CIcon icon="cilBarChart" size="lg" class="mb-1 text-secondary" />
              <p class="fs-6 m-0 ms-3 chart-header">
                Losses
              </p>
            </CTab>
            <CTab itemKey="timeseries" class="d-flex align-items-center card-header px-4">
              <CIcon icon="cilChartLine" size="xl" class="mb-1 text-secondary" />
              <p class="fs-6 m-0 ms-3 chart-header">
                Time series
              </p>
            </CTab>
          </CTabList>
          <CTabContent>
            <CTabPanel class="p-3" itemKey="home">
              Overview tab content
            </CTabPanel>
            <CTabPanel class="p-0" itemKey="costs">
              <CostsCard />
            </CTabPanel>
            <CTabPanel class="p-0" itemKey="timeseries">
              <TimeSeriesCard />
            </CTabPanel>
          </CTabContent>
        </CTabs>
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import getCountryISO2 from "country-iso-3-to-2";
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
  .nav-tabs {
    // background: rgba(255, 255, 255, 0.5); // Only for interaction with .nav-link.active background color

  }

  .nav-tabs .nav-link.active {
    background-color: rgba(255, 255, 255, 0.36) !important;
    border-bottom-color: rgba(255, 255, 255, 0.36) !important;
  }

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
