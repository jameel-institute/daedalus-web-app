<template>
  <div id="resultsPage">
    <div class="d-flex flex-wrap mb-3 gap-3">
      <h1 class="fs-2 mb-0 pt-1 me-auto">
        Results
      </h1>
      <CreateComparison v-if="featureIsEnabled('comparison')" />
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
      <ParameterInfoCard />
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
import { CIconSvg } from "@coreui/icons-vue";

const appStore = useAppStore();
const { featureIsEnabled } = useFeatureFlags();

let statusInterval: NodeJS.Timeout;
const jobSlow = ref(false);
const jobReallySlow = ref(false);
const secondsSinceFirstStatusPoll = ref("0");
const showSpinner = computed(() => !appStore.currentScenario.result.data
  && appStore.currentScenario.status.data?.runSuccess !== false
  && appStore.currentScenario.runId,
);

const route = useRoute();
const runIdFromRoute = route.params.runId as string;
if (appStore.currentScenario.runId && runIdFromRoute !== appStore.currentScenario.runId) {
  appStore.clearScenario(); // Required so that previous parameters aren't hanging around in the store.
}
appStore.downloadError = undefined;
appStore.currentScenario.runId = runIdFromRoute;

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
  }
}
</style>
