<template>
  <div>
    <h1>Comparison</h1>
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
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Scenario } from "~/types/storeTypes";

const appStore = useAppStore();

const axis = computed(() => appStore.currentComparison.axis);

const scenarioAxisValue = (scenario: Scenario) => {
  if (scenario.parameters && axis.value) {
    return scenario.parameters[axis.value];
  }
};

const scenarioIsBaseline = (scenario: Scenario) => {
  return scenarioAxisValue(scenario) === appStore.currentComparison.baseline;
};
</script>

<style scoped>
th, tr, td {
  border: 1px solid black;
  padding: 5px;
}
</style>
