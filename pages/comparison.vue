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
        Explore by {{ appStore.axisLabel?.toLocaleLowerCase() }}
      </h1>
    </div>
    <CSpinner v-show="showSpinner" class="ms-3 mb-3 mt-3" />
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
              <div class="d-flex align-items-start mx-2">
                <CostBasisToggler />
                <div class="ms-auto">
                  <CostsLegend />
                </div>
              </div>
              <CompareCostsChart />
            </CTabPanel>
            <CTabPanel item-key="timeseries">
              <p class="time-series-example">
                A time series
              </p>
            </CTabPanel>
          </CTabContent>
        </CTabs>
      </div>
    </CRow>
    <h4 class="mt-3">
      Table for debugging
    </h4>
    <table v-if="appStore.currentComparison.scenarios" class="mb-3">
      <thead>
        <tr>
          <th>
            SCENARIO
          </th>
          <th
            v-for="(value, key) in appStore.currentComparison.scenarios[0]?.parameters"
            :key="key"
            :class="{ 'bg-info-subtle': axis === key }"
          >
            {{ key }}
            <span v-if="key === axis">
              (Axis)
            </span>
          </th>
          <th>
            Run id
          </th>
          <th>
            Status of run job
          </th>
          <th>
            Job finished?
          </th>
          <th>
            Job successful?
          </th>
          <th>
            First data point in result (total cost)
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(scenario, index) in appStore.currentComparison.scenarios"
          :key="index"
          :class="{ 'text-primary': scenarioIsBaseline(scenario) }"
        >
          <td>
            {{ appStore.getScenarioAxisValue(scenario) }}
            <span v-if="scenarioIsBaseline(scenario)">
              (Baseline)
            </span>
          </td>
          <td
            v-for="(value, key) in scenario.parameters"
            :key="key"
            :class="{ 'bg-info-subtle': axis === key }"
          >
            {{ value }}
          </td>
          <td>
            {{ scenario.runId!.slice(0, 8) }}...
          </td>
          <td>
            <span v-if="scenario.status.data?.done">
              {{ scenario.status.data.runStatus }}
            </span>
            <span v-else>
              Loading...
            </span>
          </td>
          <td>
            <span v-if="scenario.status.data?.done === true">
              Yes
            </span>
            <span v-else-if="scenario.status.data?.done === false">
              No
            </span>
            <span v-else>
              Unknown
            </span>
          </td>
          <td>
            <span v-if="scenario.status.data?.runSuccess === true">
              Yes
            </span>
            <span v-else-if="scenario.status.data?.runSuccess === false">
              No
            </span>
            <span v-else>
              Unknown
            </span>
          </td>
          <td>
            <span v-if="scenario.result.data?.costs[0].value">
              {{ totalCost(scenario) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { Scenario } from "~/types/storeTypes";

const showSpinner = ref(true);

const appStore = useAppStore();
const { everyScenarioHasRunSuccessfully } = storeToRefs(appStore);
const query = useRoute().query;
appStore.clearScenario(appStore.currentScenario);
appStore.downloadError = undefined;
let statusInterval: NodeJS.Timeout;

const axis = computed(() => appStore.currentComparison.axis);

const totalCost = (scenario: Scenario) => {
  const cost = scenario?.result?.data?.costs[0].value;
  if (!cost) {
    return "No data yet";
  }
  const { amount, unit } = abbreviateMillionsDollars(cost);
  return `$${amount} ${unit}`;
};
const scenarioIsBaseline = (scenario: Scenario) => appStore.getScenarioAxisValue(scenario) === appStore.currentComparison.baseline;

watch(() => appStore.metadata, async (newMetadata) => {
  if (newMetadata) {
    appStore.setComparisonByRunIds((query.runIds as string).split(";"), query.baseline as string, query.axis as string);
  }
}, { immediate: true });

const stopWatchingComparison = watch(() => appStore.currentComparison, async (currentComp) => {
  if (!statusInterval && appStore.everyScenarioHasARunId) {
    statusInterval = setInterval(appStore.refreshComparisonStatuses, 200);
  }
  if (currentComp.scenarios?.every(s => s.status.data?.done)) {
    clearInterval(statusInterval);
    showSpinner.value = false;
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

.time-series-example {
  height: 500px;
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
