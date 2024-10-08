<template>
  <div>
    <div class="d-flex flex-wrap mb-3 gap-3">
      <h1 class="fs-2 mb-0 pt-1">
        Results
      </h1>
      <DownloadExcel />
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
                      <!-- Todo: once metadata uses real country ISOs, get a mapping from 3-letter ISOs to 2-letter ISOs, and look up the correct country flag. -->
                      <CIcon v-if="parameter.id === appStore.globeParameter?.id" icon="cifGb" class="parameter-icon text-secondary ms-1" />
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
    <CAlert v-else-if="stoppedPolling" color="danger">
      <p class="mb-0">
        The analysis is taking longer than expected. Please
        <NuxtLink prefetch-on="interaction" to="/scenarios/new">
          <span>try again</span>
        </NuxtLink>.
      </p>
    </CAlert>
    <CAlert v-else-if="jobTakingLongTime && appStore.currentScenario.status.data?.runStatus" color="info">
      <p class="mb-0">
        Analysis status: {{ appStore.currentScenario.status.data?.runStatus }}
      </p>
    </CAlert>
    <CRow v-else-if="appStore.currentScenario.result.data" class="cards-container">
      <div class="col-md-6">
        <div class="card costs-card">
          <div class="card-header border-bottom-0 d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <CIcon icon="cilChartPie" size="xl" class="mb-1 text-secondary" />
              <h2 class="fs-5 m-0 ms-3 chart-header">
                Losses
              </h2>
            </div>
          </div>
          <div class="card-body">
            <CostsPie
              :hide-tooltips="hideCostsPieTooltips"
              @mouseleave="onMouseLeaveCostsPie"
              @mouseover="() => { hideCostsPieTooltips = false }"
            />
            <div id="totalCostContainer" style="display: inline-block;">
              <p style="font-size: 1.5rem; margin-bottom: 0; height: fit-content;">
                Total
              </p>
              <div id="gdpTotalCostContainer" style="line-height: 1; display: flex;" class="gap-1">
                <p style="font-size: 10rem; width: unset; font-weight: normal">
                  X.YZ
                </p>
                <div style="align-self: center;">
                  <p style="font-size: 4.5rem; margin-bottom: 0">
                    %
                  </p>
                  <p style="font-size: 1.5rem; margin-top: 0; font-weight: normal !important;">
                    of GDP
                  </p>
                </div>
              </div>
              <div id="usdTotalCostContainer" style="line-height: 1;">
                <div style="display: inline-block; text-align: right;">
                  <p style="font-size: 2.5rem; margin-bottom: 0;">
                    $
                  </p>
                  <p style="font-size: 1rem; margin-top: 0; font-weight: normal !important;">
                    USD
                  </p>
                </div>
                <p style="font-size: 5rem; display: inline-block; margin-bottom: 0;">
                  <span id="usdTotalCost" class="spin-number">
                    <span>{{ totalCostAbbr?.amount }}</span>
                    <span style="font-size: smaller;">
                      {{ totalCostAbbr?.unit }}
                    </span>
                  </span>
                </p>
                <p style="font-weight: normal !important; margin-top: 0;">
                  based on 2023 GDP [tbc]
                </p>
              </div>
            </div>
            <CostsLegend />
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header border-bottom-0 d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <CIcon icon="cilChartLine" size="xl" class="mb-1 text-secondary" />
              <h2 class="fs-5 m-0 ms-3 chart-header">
                Time series
              </h2>
            </div>
            <TimeSeriesLegend />
          </div>
          <TimeSeriesList />
        </div>
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import { runStatus } from "~/types/apiResponseTypes";
import type { Parameter } from "~/types/parameterTypes";
import { abbreviateMillionsDollars } from "~/utils/money";

// TODO: Use the runId from the route rather than getting it out of the store.
const appStore = useAppStore();

const hideCostsPieTooltips = ref(false);
const jobTakingLongTime = ref(false);
const stoppedPolling = ref(false);
const showSpinner = computed(() => {
  return (!appStore.currentScenario.result.data
    && appStore.currentScenario.result.fetchStatus !== "error"
    && !stoppedPolling.value);
});
const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario?.parameters && appStore.currentScenario?.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.loadScenarioStatus();
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResult();
}

let statusInterval: NodeJS.Timeout;
const loadScenarioStatus = () => {
  appStore.loadScenarioStatus().then(() => {
    if (appStore.currentScenario.status.data?.runSuccess) {
      clearInterval(statusInterval);
      jobTakingLongTime.value = false;
      appStore.loadScenarioResult();
    }
  });
};

const onMouseLeaveCostsPie = () => {
  setTimeout(() => {
    hideCostsPieTooltips.value = true;
  }, 500);
};

onMounted(() => {
  appStore.globe.interactive = false;

  if (!appStore.currentScenario.status.data?.done && appStore.currentScenario.runId) {
    statusInterval = setInterval(loadScenarioStatus, 200); // Poll for status every N ms
    setTimeout(() => {
      // If the job isn't completed within five seconds, give user the information about the run status.
      if (appStore.currentScenario.status.data?.runStatus !== runStatus.Complete) {
        jobTakingLongTime.value = true;
      }
    }, 5000);
    setTimeout(() => {
      // If the job isn't completed within 10 seconds, terminate polling for status.
      if (!appStore.currentScenario.status.data?.done) {
        jobTakingLongTime.value = false;
        stoppedPolling.value = true;
      }
      clearInterval(statusInterval);
    }, 15000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

.cards-container {
  row-gap: 1rem;
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
      background-color: unset; // Overrides a style in _theme.scss
    }
  }
}

.costs-card {
  #totalCostContainer {
    font-weight: 500;
  }
  // color: $imperial-blue;
  // text-shadow: 0px 0px 4px rgba(0, 55, 138, 1);

  p {
    margin: 0.75rem 0;
    padding: 0;
  }
}

.chart-header {
  height: fit-content;
}
</style>
