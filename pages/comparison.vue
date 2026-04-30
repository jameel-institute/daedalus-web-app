<template>
  <div>
    <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
      <CIconSvg size="xxl">
        <img src="/icons/rotate-device.svg">
      </CIconSvg>
      <p class="mb-0">
        Rotate your mobile device to landscape for the best experience.
      </p>
    </CAlert>
    <div class="d-flex mb-3 flex-wrap gap-2">
      <h1 class="fs-3 mb-0 pt-1 pe-5 me-auto text-nowrap flex-fill">
        Explore by {{ appStore.axisMetadata?.label.toLocaleLowerCase() }}
      </h1>
      <CodeSnippet :scenarios="appStore.currentComparison.scenarios" />
      <DownloadExcel :comparison="true" />
      <ParameterInfoCard :scenario="appStore.baselineScenario">
        <template #header>
          <div class="card-header w-100 h-100">
            <NuxtLink
              prefetch-on="interaction"
              :to="`/scenarios/${appStore.baselineScenario?.runId}`"
            >
              Baseline scenario
            </NuxtLink>
          </div>
        </template>
      </ParameterInfoCard>
    </div>
    <CSpinner v-if="showSpinner" class="ms-3 mb-3 mt-3" />
    <CAlert v-if="showJobSlowAlert" color="info">
      <p>
        Thank you for waiting. Scenarios can sometimes take up to 10 seconds to run, and comparisons may take longer.
      </p>
      <p class="mb-0">
        Waiting for {{ secondsSinceFirstStatusPoll }} seconds
      </p>
    </CAlert>
    <CAlert v-if="unsuccessfulScenarios.length || scenariosWithFetchErrors.length" color="danger">
      <CAlertHeading>
        <CIcon icon="cilWarning" class="flex-shrink-0 me-2" width="24" height="24" />
        Error
      </CAlertHeading>
      <p class="mt-3">
        There was an unexpected error. Please try again later.
      </p>
      <hr>
      <template v-for="scenario in unsuccessfulScenarios" :key="scenario.runId">
        <p
          v-for="(errorMsg, index) in scenario.status.data?.runErrors"
          :key="index"
        >
          {{ errorMsg }}
        </p>
      </template>
      <template v-for="scenario in scenariosWithFetchErrors" :key="scenario.runId">
        <p v-if="scenario.status.fetchError" class="mb-0">
          Error details: {{ scenario.status.fetchError.data?.message ?? scenario.status.fetchError.message }}
        </p>
        <p v-if="scenario.result.fetchError" class="mb-0">
          Error details: {{ scenario.result.fetchError.data?.message ?? scenario.result.fetchError.message }}
        </p>
      </template>
    </CAlert>
    <CRow v-if="appStore.everyScenarioHasCosts" class="results-cards-container">
      <div class="col-12">
        <CTabs active-item-key="costs">
          <CTabList variant="underline">
            <CTab item-key="costs" class="d-flex align-items-end px-4">
              <CIcon icon="cilBarChart" size="lg" class="mb-1 text-inherit" />
              <p class="fs-6 m-0 ms-3">
                Losses
              </p>
            </CTab>
            <CTab item-key="timeseries" class="d-flex align-items-end px-4">
              <CIcon icon="cilChartLine" size="xl" class="mb-1 text-inherit" />
              <p class="fs-6 m-0 ms-3">
                Time series
              </p>
            </CTab>
          </CTabList>
          <CTabContent class="">
            <CTabPanel class="pt-3" item-key="costs">
              <CompareCostsTab />
            </CTabPanel>
            <CTabPanel item-key="timeseries">
              <CompareTimeSeriesTab />
            </CTabPanel>
          </CTabContent>
        </CTabs>
      </div>
    </CRow>
  </div>
</template>

<script setup lang="ts">
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { runStatus } from "~/types/apiResponseTypes";

const nuxtApp = useNuxtApp();
const appStore = useAppStore();
const { scenariosWithFetchErrors, unsuccessfulScenarios, everyScenarioHasRunSuccessfully, everyScenarioIsDone } = storeToRefs(appStore);
const query = useRoute().query;

const jobSlow = ref(false);
const secondsSinceFirstStatusPoll = ref("0");

const showSpinner = computed(() => {
  return !everyScenarioIsDone.value
    && scenariosWithFetchErrors.value.length === 0
    && unsuccessfulScenarios.value.length === 0;
});

const showJobSlowAlert = computed(() => {
  return jobSlow.value && appStore.currentComparison.scenarios.some((s) => {
    return !s.result.data && ["queued", "running"].includes(s.status.data?.runStatus as runStatus);
  });
});

appStore.clearScenario(appStore.currentScenario);
appStore.downloadError = undefined;
let statusInterval: NodeJS.Timeout;

watch(() => appStore.metadata, async (newMetadata) => {
  if (newMetadata) {
    appStore.setComparisonByRunIds((query.runIds as string).split(";"), query.baseline as string, query.axis as string);
  }
}, { immediate: true });

// Use useAsyncData to store the time once, during server-side rendering: avoids client render re-writing value.
const { data: timeOfFirstStatusPoll } = await useAsyncData<number>("timeOfFirstStatusPoll", async () => {
  return new Promise<number>((resolve) => {
    resolve(new Date().getTime());
  });
});

const stopWatchingComparison = watch(everyScenarioIsDone, () => {
  if (!statusInterval && appStore.everyScenarioHasARunId) {
    statusInterval = setInterval(() => {
      if (timeOfFirstStatusPoll.value) {
        secondsSinceFirstStatusPoll.value = ((new Date().getTime() - timeOfFirstStatusPoll.value) / 1000).toFixed(0);
      };
      appStore.refreshComparisonStatuses(nuxtApp);
    }, 200);
    setTimeout(() => {
      if (!everyScenarioIsDone.value) {
        jobSlow.value = true;
      }
    }, 5000);
  }
  if (everyScenarioIsDone.value) {
    clearInterval(statusInterval);
    jobSlow.value = false;
  }
}, { deep: true, immediate: true });

watch(everyScenarioHasRunSuccessfully, async (allRanSuccessfully) => {
  if (allRanSuccessfully) {
    stopWatchingComparison();
    await appStore.loadComparisonResults();
  }
}, { immediate: true });

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

.results-cards-container {
  // The widest width that might trigger the heading flex row to wrap
  // (Determined empirically using longest heading 'Explore by global vaccine investment' and longest parameter values)
  $comparison-heading-wrap-width: 91rem;

  @media (min-width: $comparison-heading-wrap-width) {
    position: relative;
    top: -2.5rem;
  }
}

th, tr, td {
  border: 1px solid black;
  padding: 5px;
}

:deep(.tab-content) {
  background: $lighter-background;
  color: var(--cui-dark-text-emphasis);
  padding: 1rem;
  border-radius: 5px;
  border-top-left-radius: 0;
  border-color: var(--cui-border-color-translucent);
  border-style: solid;
  border-width: 1px;
}

:deep(.nav-underline) {
  --cui-nav-link-color: var(--cui-secondary-color);
  --cui-nav-underline-gap: 0.5rem;
}

:deep(.nav-underline .nav-link) {
  color: var(--cui-nav-link-color);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-color: transparent;
  border-style: solid;
  border-width: 1px;
  border-bottom-width: 0.125rem;

  &:hover {
    border-bottom-color: var(--cui-border-color-translucent);
    border-color: var(--cui-border-color-translucent);
    background-color: $light-background;
  }
}

:deep(.nav-underline .nav-link.active, .nav-underline .show > .nav-link) {
  font-weight: unset;
  color: $primary;
  background-color: $lighter-background;

  border-color: var(--cui-border-color-translucent);
  border-bottom-color: currentcolor;
}
</style>
