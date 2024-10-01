<template>
  <div>
    <div class="d-flex flex-wrap mb-4">
      <h1 class="fs-2 mb-0 pt-1">
        Results
      </h1>
      <div class="d-inline-block float-end ms-2 align-content-end">
        <CTooltip content="Download as Excel file" placement="top">
          <template #toggler="{ togglerId, on }">
            <CButton color="light" :aria-describedby="togglerId" shape="ghost" v-on="on">
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
        aria-labelledby="LiveDemoExampleLabel"
        @close="() => { parameterModalVisible = false }"
      >
        <CModalHeader>
          <CModalTitle id="LiveDemoExampleLabel">
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
            <CButton color="light">
              Parameters
            </CButton>
            <CIcon icon="cilPencil" class="form-icon link-secondary" />
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
    <div v-else-if="appStore.timeSeriesData" class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header border-bottom-0">
            <h2 class="fs-5 mt-1">
              Time series
            </h2>
            <div class="d-flex justify-content-between">
              <p>
                Click and drag to zoom into a selection of the graph. The vertical axis will be re-scaled automatically.
              </p>
              <TimeSeriesLegend />
            </div>
          </div>
          <div class="card-body p-0">
            <!-- Per time series, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
            <!-- <CAccordion
              v-for="(_, seriesId, index) in appStore.timeSeriesData"
              :key="seriesId"
              :style="accordionStyle"
              :active-item-key="seriesId"
            >
              <CAccordionItem :item-key="seriesId" class="border-0">
                <TimeSeries
                  :id="seriesId"
                  :index="index"
                />
              </CAccordionItem>
            </CAccordion> -->
            <TimeSeries
              v-for="(_, seriesId, index) in appStore.timeSeriesData"
              :key="seriesId"
              :series-id="seriesId"
              :index="index"
              :open-accordions="openTimeSeriesAccordions"
              @toggle-open="toggleOpen(seriesId)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { Parameter } from "~/types/parameterTypes";

// TODO: Use the runId from the route rather than getting it out of the store. Use a single source of truth for the runId.
const appStore = useAppStore();

const parameterModalVisible = ref(false);
const openTimeSeriesAccordions = ref<string[]>([]);

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario.parameters && appStore.currentScenario.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

const toggleOpen = (seriesId: string) => {
  if (openTimeSeriesAccordions.value.includes(seriesId)) {
    openTimeSeriesAccordions.value = openTimeSeriesAccordions.value.filter(id => id !== seriesId);
  } else {
    openTimeSeriesAccordions.value = [...openTimeSeriesAccordions.value, seriesId];
  }
};

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.loadScenarioStatus();
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResults();
}

let statusInterval: NodeJS.Timeout;
const loadScenarioStatus = () => {
  appStore.loadScenarioStatus().then(() => {
    if (appStore.currentScenario.status.data?.runSuccess) {
      clearInterval(statusInterval);
      appStore.loadScenarioResults();
    }
  });
};

watch(() => (Object.keys(appStore.timeSeriesData || {})), (seriesIds) => {
  openTimeSeriesAccordions.value = seriesIds;
});

onMounted(() => {
  appStore.globe.interactive = false;
  if (!appStore.currentScenario.status.data?.done || appStore.currentScenario.result.data) {
    statusInterval = setInterval(loadScenarioStatus, 200); // Poll for status every N ms
    setTimeout(() => {
      clearInterval(statusInterval); // Terminate polling for status after 5 seconds
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
</style>
