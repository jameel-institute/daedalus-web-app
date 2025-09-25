<template>
  <div>
    <div class="d-flex flex-wrap mb-3 gap-3 heading-row">
      <h1 class="fs-2 mb-0 pt-1 me-auto">
        Results
      </h1>
      <CreateComparison @show-r-code="handleShowRCode" />
      <DownloadExcel />
      <CodeSnippet ref="codeSnippet" />
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
      v-if="!appStore.currentScenario.result.data && jobSlow && appStore.currentScenario.status.data?.runStatus"
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
        <CostsPanel />
      </div>
      <div class="col-12 col-xl-6">
        <TimeSeriesPanel />
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIconSvg } from "@coreui/icons-vue";

const appStore = useAppStore();

let statusInterval: NodeJS.Timeout;
const jobSlow = ref(false);
const jobReallySlow = ref(false);
const secondsSinceFirstStatusPoll = ref("0");
const showSpinner = computed(() => !appStore.currentScenario.result.data
  && appStore.currentScenario.status.data?.runSuccess !== false
  && appStore.currentScenario.runId,
);

const route = useRoute();
const runId = route.params.runId as string;

// Required so that previous parameters aren't hanging around in the store
appStore.clearScenario(appStore.currentScenario);
appStore.downloadError = undefined;

// Fetch scenario from db so we can know its parameters now rather than wait for them in the result data
appStore.currentScenario.runId = runId;
await appStore.loadScenarioDetails(appStore.currentScenario);

// Use useAsyncData to store the time once, during server-side rendering: avoids client render re-writing value.
const { data: timeOfFirstStatusPoll } = await useAsyncData<number>("timeOfFirstStatusPoll", async () => {
  return new Promise<number>((resolve) => {
    resolve(new Date().getTime());
  });
});

const codeSnippet = ref<{ modalVisible: boolean } | null>(null);

const handleShowRCode = () => {
  if (codeSnippet.value) {
    codeSnippet.value.modalVisible = true;
  }
};

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.refreshScenarioStatus(appStore.currentScenario);
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResult(appStore.currentScenario);
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
    jobReallySlow.value = false;
  }
});

const pollForStatusEveryNSeconds = (seconds: number) => {
  statusInterval = setInterval(() => {
    if (timeOfFirstStatusPoll.value) {
      secondsSinceFirstStatusPoll.value = ((new Date().getTime() - timeOfFirstStatusPoll.value) / 1000).toFixed(0);
    };
    appStore.refreshScenarioStatus(appStore.currentScenario);
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
