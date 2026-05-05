<template>
  <div>
    <div class="d-flex flex-wrap mb-3 gap-3 heading-row">
      <h1 class="fs-2 mb-0 pt-1 me-auto">
        Results
      </h1>
      <CreateComparison @show-r-code="handleShowRCode" />
      <DownloadExcel :comparison="false" />
      <CodeSnippet ref="codeSnippet" :scenarios="[appStore.currentScenario]" />
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl">
          <img src="/icons/rotate-device.svg">
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
      <ParameterInfoCard :scenario="appStore.currentScenario">
        <template #header>
          <CCol class="col-auto">
            <div
              class="card-header h-100 align-content-center"
            >
              <EditParameters @show-r-code="handleShowRCode" />
            </div>
          </CCol>
        </template>
      </ParameterInfoCard>
    </div>
    <CAlert v-if="showJobSlowAlert" color="info">
      <p>
        Thank you for waiting. Scenarios can sometimes take up to 10 seconds to run.
      </p>
      <p class="mb-0">
        Waiting for {{ secondsSinceFirstStatusPoll }} seconds
      </p>
    </CAlert>
    <CSpinner v-if="showSpinner" class="ms-3 mb-3 mt-3" />
    <CAlert
      v-if="scenarioStatusResponseError || scenarioResultResponseError || appStore.currentScenario.status.data?.runSuccess === false"
      color="danger"
    >
      <CAlertHeading>
        <CIcon icon="cilWarning" class="flex-shrink-0 me-2" width="24" height="24" />
        Error
      </CAlertHeading>
      <p class="mt-3">
        There was an unexpected error.
        {{ appStore.currentScenario.status.data?.runSuccess !== false ? "Please refresh the page." : "Please try again later." }}
      </p>
      <hr>
      <template v-if="appStore.currentScenario.status.data?.runSuccess === false">
        <p
          v-for="(errorMsg, index) in appStore.currentScenario.status.data.runErrors"
          :key="index"
        >
          {{ errorMsg }}
        </p>
      </template>
      <p v-if="scenarioStatusResponseError" class="mb-0">
        Error details: {{ scenarioStatusResponseError.data?.message ?? scenarioStatusResponseError.message }}
      </p>
      <p v-if="scenarioResultResponseError" class="mb-0">
        Error details: {{ scenarioResultResponseError.data?.message ?? scenarioResultResponseError.message }}
      </p>
    </CAlert>
    <CRow v-else-if="appStore.currentScenario.result.data" class="results-cards-container">
      <div class="col-12 col-xl-6">
        <CostsPanel />
      </div>
      <div class="col-12 col-xl-6">
        <TimeSeriesPanel />
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { runStatus } from "~/types/apiResponseTypes";

const appStore = useAppStore();

let statusInterval: NodeJS.Timeout;
const jobSlow = ref(false);
const timeOfFirstStatusPoll = ref(new Date().getTime());
const secondsSinceFirstStatusPoll = ref("0");
const scenarioStatusResponseError = computed(() => appStore.currentScenario.status.fetchError);
const scenarioResultResponseError = computed(() => appStore.currentScenario.result.fetchError);
const showSpinner = computed(() => !appStore.currentScenario.result.data
  && appStore.currentScenario.status.data?.runSuccess !== false
  && appStore.currentScenario.runId
  && !scenarioStatusResponseError.value
  && !scenarioResultResponseError.value,
);

const showJobSlowAlert = computed(() => {
  return !appStore.currentScenario.result.data
    && jobSlow.value
    && ["queued", "running"].includes(appStore.currentScenario.status.data?.runStatus as runStatus);
});

const route = useRoute();
const runId = route.params.runId as string;

// Required so that previous parameters aren't hanging around in the store
appStore.clearScenario(appStore.currentScenario);
appStore.clearComparison();
appStore.downloadError = undefined;

// Fetch scenario from db so we can know its parameters now rather than wait for them in the result data
appStore.currentScenario.runId = runId;
await appStore.loadScenarioDetails(appStore.currentScenario);

const codeSnippet = ref<{ modalVisible: boolean } | null>(null);

const handleShowRCode = () => {
  if (codeSnippet.value) {
    codeSnippet.value.modalVisible = true;
  }
};

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.refreshScenarioStatus(appStore.currentScenario);
if (appStore.currentScenario.status.data?.runSuccess) {
  await appStore.loadScenarioResult(appStore.currentScenario);
}

watch(() => appStore.currentScenario.status.data?.runSuccess, (runSuccess) => {
  if (runSuccess) {
    appStore.loadScenarioResult(appStore.currentScenario);
  }
});

watch(() => appStore.currentScenario.status.data?.done, (done) => {
  if (done) {
    clearInterval(statusInterval);
    jobSlow.value = false;
  }
});

const pollForStatusEveryNSeconds = (seconds: number) => {
  statusInterval = setInterval(() => {
    secondsSinceFirstStatusPoll.value = ((new Date().getTime() - timeOfFirstStatusPoll.value) / 1000).toFixed(0);
    appStore.refreshScenarioStatus(appStore.currentScenario);
  }, seconds * 1000);
};

onMounted(() => {
  appStore.globe.interactive = false;

  if (!appStore.currentScenario.status.data?.done && appStore.currentScenario.runId) {
    pollForStatusEveryNSeconds(0.2);
    setTimeout(() => {
      if (!appStore.currentScenario.status.data?.done) {
        jobSlow.value = true;
      }
    }, 5000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss" scoped>
.results-cards-container {
  row-gap: 1rem;
}

.heading-row .card {
  display: flex;
  flex-direction: row;

  .card-header {
    padding: 0;
    border-width: 0;
    border-bottom-width: 0;
    border-radius: var(--cui-card-inner-border-radius);
    border-right: 0;
  }
}
</style>
