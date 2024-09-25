<template>
  <div>
    <div class="d-flex flex-wrap mb-2">
      <h1 class="fs-1 mb-0">
        Results
      </h1>
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
            <CButton color="light" size="">
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
      <CAccordion v-show="false && !appStore.largeScreen && appStore.currentScenario.parameters && appStore.metadata?.parameters" class="ms-auto">
        <CAccordionItem :item-key="1">
          <CAccordionHeader>
            Parameters
          </CAccordionHeader>
          <CAccordionBody>
            <p v-for="(parameter) in appStore.metadata?.parameters" :key="parameter.id" class="card-text">
              <ParameterIcon :parameter="parameter" />
              <span v-show="appStore.currentScenario" class="ms-2">
                {{ paramDisplayText(parameter) }}
              </span>
              <!-- Todo: once metadata uses real country ISOs, get a mapping from 3-letter ISOs to 2-letter ISOs, and look up the correct country flag. -->
              <CIcon v-if="parameter.id === appStore.globeParameter?.id" icon="cifZw" class="parameter-icon text-secondary ms-1" size="sm" />
            </p>
            <CIcon icon="cilPencil" class="form-icon" />
            <NuxtLink to="/scenarios/new" class="ms-2 link-secondary">
              <span>Edit parameters</span>
            </NuxtLink>
          </CAccordionBody>
        </CAccordionItem>
      </CAccordion>
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
    <div v-else class="row">
      <div class="col-md-12">
        <div class="card mb-4">
          <div class="card-header">
            Time series
          </div>
          <div class="card-body">
            <p>Click and drag to zoom into a selection of the graph. The vertical axis will be re-scaled automatically.</p>
            <div v-if="appStore.timeSeriesData">
              <div v-for="(_, seriesId, index) in appStore.timeSeriesData" :key="seriesId">
                <TimeSeries
                  :id="seriesId"
                  :index="index"
                />
              </div>
            </div>
            <CSpinner
              v-show="appStore.currentScenario.status.data?.runStatus === runStatus.Queued || appStore.currentScenario.status.data?.runStatus === runStatus.Running"
              color="secondary"
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
import { runStatus } from "~/types/apiResponseTypes";

// TODO: Use the runId from the route rather than getting it out of the store. Use a single source of truth for the runId.
const appStore = useAppStore();

const parameterModalVisible = ref(false);

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

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario.parameters && appStore.currentScenario.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

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
