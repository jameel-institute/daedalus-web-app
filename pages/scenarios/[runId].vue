<template>
  <div>
    <div class="d-flex flex-wrap mb-4">
      <h1 class="fs-2 mb-0 pt-1">
        Results
      </h1>
      <!-- TODO: move this into its own component -->
      <div v-show="appStore.currentScenario.parameters" class="d-inline-block ms-2 align-content-center">
        <CSpinner v-if="appStore.downloading" size="sm" class="ms-2" />
        <CTooltip v-else content="Download as Excel file" placement="top">
          <template #toggler="{ togglerId, on }">
            <CButton color="light" :aria-describedby="togglerId" v-on="on" @click="appStore.downloadExcel()">
              <CIcon icon="cilCloudDownload" size="lg" />
            </CButton>
          </template>
        </CTooltip>
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
      <CModal
        :visible="parameterModalVisible"
        aria-labelledby="modalTitle"
        @close="() => { parameterModalVisible = false }"
      >
        <CModalHeader>
          <CModalTitle id="modalTitle">
            Edit parameters
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <ParameterForm :in-modal="true" />
        </CModalBody>
      </CModal>
      <div v-show="appStore.currentScenario.parameters && appStore.metadata?.parameters" class="card horizontal-card ms-auto">
        <CRow>
          <div
            v-show="!appStore.largeScreen"
            class="card-header h-100 align-content-center"
            role="button"
            @click="() => { parameterModalVisible = true }"
          >
            <CTooltip
              content="Edit parameters"
              placement="top"
            >
              <template #toggler="{ togglerId, on }">
                <span :aria-describedby="togglerId" v-on="on">
                  <CButton color="light">
                    Parameters
                  </CButton>
                  <CIcon icon="cilPencil" class="form-icon link-secondary" />
                </span>
              </template>
            </CTooltip>
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
                      <CIcon
                        v-if="parameter.id === appStore.globeParameter?.id"
                        icon="cifGb"
                        class="parameter-icon text-secondary ms-1"
                      />
                    </span>
                  </template>
                </CTooltip>
              </p>
            </div>
          </CCol>
          <CCol v-show="appStore.largeScreen" class="col-auto">
            <CTooltip
              content="Edit parameters"
              placement="top"
            >
              <template #toggler="{ togglerId, on }">
                <div
                  class="card-footer h-100 align-content-center"
                  role="button"
                  :aria-describedby="togglerId"
                  @click="() => { parameterModalVisible = true }"
                  v-on="on"
                >
                  <CButton color="light">
                    Parameters
                  </CButton>
                  <CIcon icon="cilPencil" class="form-icon link-secondary" />
                </div>
              </template>
            </CTooltip>
          </CCol>
        </CRow>
      </div>
    </div>
    <CAlert v-if="appStore.currentScenario.status.data?.runSuccess === false" color="danger">
      The analysis run failed. Please
      <NuxtLink prefetch-on="interaction" to="/scenarios/new">
        try again.
      </NuxtLink>
      <p v-for="(errorMsg, index) in appStore.currentScenario.status.data.runErrors" :key="index">
        {{ errorMsg }}
      </p>
    </CAlert>
    <CRow v-else-if="appStore.timeSeriesData">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header border-bottom-0 d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <CIcon icon="cilChartPie" size="xl" class="mb-1 text-secondary" />
              <h2 class="fs-5 m-0 ms-3 chart-header">
                Costs
              </h2>
            </div>
          </div>
          <div class="card-body">
            <p>Placeholder for costs chart</p>
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
          <div
            class="card-body p-0"
            @mouseleave="onMouseLeaveTimeSeries"
            @mouseover="() => { hideTimeSeriesTooltips = false }"
          >
            <TimeSeries
              v-for="(_, seriesId, index) in appStore.timeSeriesData"
              :key="seriesId"
              :series-id="seriesId"
              :index="index"
              :opened-accordions="openedTimeSeriesAccordions"
              :hide-tooltips="hideTimeSeriesTooltips"
              @toggle-open="toggleOpen(seriesId)"
            />
          </div>
        </div>
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { Parameter } from "~/types/parameterTypes";

// TODO: Use the runId from the route rather than getting it out of the store. Use a single source of truth for the runId.
const appStore = useAppStore();

const parameterModalVisible = ref(false);
const openedTimeSeriesAccordions = ref<string[]>([]);
const hideTimeSeriesTooltips = ref(false);

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario.parameters && appStore.currentScenario.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

const toggleOpen = (seriesId: string) => {
  if (openedTimeSeriesAccordions.value.includes(seriesId)) {
    openedTimeSeriesAccordions.value = openedTimeSeriesAccordions.value.filter(id => id !== seriesId);
  } else {
    openedTimeSeriesAccordions.value = [...openedTimeSeriesAccordions.value, seriesId];
  }
};

const onMouseLeaveTimeSeries = () => {
  setTimeout(() => {
    hideTimeSeriesTooltips.value = true;
  }, 500);
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
      appStore.loadScenarioResult();
    }
  });
};

watch(() => (Object.keys(appStore.timeSeriesData || {})), (seriesIds) => {
  openedTimeSeriesAccordions.value = seriesIds;
});

onMounted(() => {
  appStore.globe.interactive = false;
  if (!appStore.currentScenario.status.data?.done || appStore.currentScenario.result.data) {
    statusInterval = setInterval(loadScenarioStatus, 200); // Poll for status every N ms
    setTimeout(() => {
      clearInterval(statusInterval); // Terminate polling for status after several seconds
    }, 5000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

.card {
  background: rgba(255, 255, 255, 0.7);

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
}

.help {
  &:not(:hover) {
    filter: opacity(0.5);
  }
}

.chart-header {
  height: fit-content;
}
</style>
