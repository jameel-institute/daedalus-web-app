<template>
  <div>
    <h1>Comparison</h1>
    <CSpinner v-show="showSpinner" class="ms-3 mb-3 mt-3" />
    <table v-if="appStore.currentComparison.scenarios">
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
            {{ scenarioAxisValue(scenario) }}
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
    <!-- <CompareCostsChart v-if="appStore.currentComparison.scenarios" /> -->
  </div>
</template>

<script setup lang="ts">
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
const scenarioAxisValue = (scenario: Scenario) => axis.value ? scenario.parameters?.[axis.value] : undefined;
const scenarioIsBaseline = (scenario: Scenario) => scenarioAxisValue(scenario) === appStore.currentComparison.baseline;

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

<style scoped>
th, tr, td {
  border: 1px solid black;
  padding: 5px;
}
</style>
