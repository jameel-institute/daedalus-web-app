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
    <CSpinner v-show="showSpinner" class="ms-3 mb-3 mt-3" />
    <div v-if="appStore.everyScenarioHasCosts" class="col-12">
      <div class="d-flex align-items-start mx-2">
        <CostBasisToggler />
        <div class="ms-auto">
          <CostsLegend />
        </div>
      </div>
      <CompareCostsChart />
    </div>
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
import { CIconSvg } from "@coreui/icons-vue";
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

.results-cards-container {
  // The widest width that might trigger the heading flex row to wrap
  // (Determined empirically using longest heading 'Explore by global vaccine investment' and longest parameter values)
  $comparison-heading-wrap-width: 91rem;

  @media (min-width: $comparison-heading-wrap-width) {
    position: relative;
    top: -2.5rem;
  }
}

.time-series-example {
  height: 500px;
}

th, tr, td {
  border: 1px solid black;
  padding: 5px;
}
</style>
