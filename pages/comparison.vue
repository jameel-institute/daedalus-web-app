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
            <span v-if="scenario.runId">
              {{ scenario.runId.slice(0, 8) }}...
            </span>
            <span v-else>
              Not known yet
            </span>
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
// TODO: We need to be able to distinguish new and old results,
// slash, serve the SAME results up when user returns to same url.
// So query params are not enough, we need to use the runIds in the URL?
// No: one better, we need to use the model version in the URL query params.

import type { ParameterSet } from "~/types/parameterTypes";
import type { Scenario } from "~/types/storeTypes";

const showSpinner = ref(true);

const appStore = useAppStore();
appStore.clearCurrentScenario();
appStore.downloadError = undefined;
let statusInterval: NodeJS.Timeout;

const axis = computed(() => appStore.currentComparison.axis);
const everyScenariosHasRunSuccessfully = computed(() => {
  return appStore.currentComparison.scenarios?.length
    && appStore.currentComparison.scenarios?.every(s => s.status.data?.runSuccess);
});

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

const pollStatusesEveryNSeconds = (seconds: number) => {
  statusInterval = setInterval(async () => {
    // Wait until we have runIds for every scenario before fetching their statuses
    if (!appStore.currentComparison.scenarios || appStore.currentComparison.scenarios?.some(s => !s.runId)) {
      return;
    }
    await Promise.all(appStore.currentComparison.scenarios.map(async (scenario) => {
      await appStore.refreshScenarioStatus(scenario);
    }));
  }, seconds * 1000);
};

watch(() => appStore.metadata, async (newMetadata) => {
  if (newMetadata) {
    const query = useRoute().query;
    // TODO: (jidea-253) These URL query params will need to be validated, since users might type anything into the URL bar

    const parameterIds = newMetadata.parameters.map(p => p.id);
    const selectedScenarios = (query.scenarios as string).split(";");

    const parametersFromQuery = parameterIds.reduce((acc, id) => {
      if (query[id]) {
        acc[id] = query[id] as string;
      }
      return acc;
    }, {} as ParameterSet);

    // TODO: Check that the baseline option does in fact match the currentScenario

    appStore.setComparison(query.axis as string, parametersFromQuery, selectedScenarios);

    await Promise.all(
      appStore.currentComparison.scenarios?.map(async (scenario) => {
        if (!scenario.parameters) {
          return;
        }

        const runId = await appStore.runScenarioByParameters(scenario.parameters);
        scenario.runId = runId;
      }) || [],
    );
  }
}, { immediate: true });

const stopWatchingComparison = watch(() => appStore.currentComparison, async (currentComp) => {
  if (!statusInterval && currentComp.scenarios?.every(s => !!s.runId)) {
    pollStatusesEveryNSeconds(0.2);
  }
  if (currentComp.scenarios?.every(s => s.status.data?.done)) {
    clearInterval(statusInterval);
    showSpinner.value = false;
  }
}, { deep: true, immediate: true });

watch(everyScenariosHasRunSuccessfully, async (allRanSuccessfully) => {
  if (allRanSuccessfully) {
    stopWatchingComparison();
    await Promise.all(
      appStore.currentComparison.scenarios?.map(async (scenario) => {
        await appStore.loadScenarioResult(scenario);
      }) || [],
    );
  }
}, { immediate: true });

// todo - see if using useInterval from vueuse will allow us to avoid having to clear the interval manually on unmounted
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
