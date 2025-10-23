<template>
  <table class="table rounded table-hover table-sm" aria-label="Costs table">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th>
          <CButton
            class="btn p-0 text-decoration-none text-muted"
            color="link"
            data-testid="toggle-costs-table"
            :aria-expanded="accordioned"
            :aria-label="accordioned ? 'Expand costs table' : 'Collapse costs table'"
            aria-controls="costs-table-body"
            @click="() => { accordioned = !accordioned; }"
          >
            <CIcon :icon="accordioned ? 'cilPlus' : 'cilMinus'" />
            <span class="ps-1">{{ accordioned ? "Expand" : "Collapse" }} all</span>
          </CButton>
        </th>
        <th
          v-for="(scenario, index) in scenariosToDisplay"
          :key="scenario.runId"
        >
          <div class="d-flex flex-column">
            <span v-if="index === 0" class="boldish">
              {{ appStore.preferences.costBasis === CostBasis.PercentGDP ? "% of GDP" : "$, millions (USD)" }}
            </span>
            <span
              v-if="multiScenario"
              class="fw-light"
              :class="{ 'text-primary-emphasis fw-medium': scenario === appStore.baselineScenario }"
            >
              {{ scenarioLabel(scenario) }}
            </span>
          </div>
        </th>
      </tr>
    </thead>
    <tbody id="costs-table-body">
      <tr class="bg-white fw-medium">
        <td class="ps-2">
          {{ props.diffing ? "Net losses relative to baseline" : "Total losses" }}
        </td>
        <td
          v-for="(scenario) in scenariosToDisplay"
          :key="scenario.runId"
          :class="scenarioClass(scenario)"
        >
          {{ displayValue(scenario, 'total', USD_METRIC) }}
        </td>
      </tr>
      <template
        v-for="(childCost) in appStore.getScenarioTotalCost(props.scenarios[0])?.children"
        :key="childCost.id"
      >
        <tr>
          <td class="ps-4 text-nowrap" :class="{ 'single-scenario-td': !multiScenario }">
            {{ appStore.getCostLabel(childCost.id) }}{{ childCost.id === 'life_years' ? '*' : '' }}
          </td>
          <td
            v-for="(scenario) in scenariosToDisplay"
            :key="scenario.runId"
            :class="scenarioClass(scenario)"
          >
            {{ displayValue(scenario, childCost.id, USD_METRIC) }}
          </td>
        </tr>
        <tr
          v-for="grandChildCost in childCost.children"
          v-show="!accordioned"
          :key="grandChildCost.id"
          class="nested-row fw-lighter"
        >
          <td>{{ appStore.getCostLabel(grandChildCost.id) }}</td>
          <td
            v-for="(scenario) in scenariosToDisplay"
            :key="scenario.runId"
            :class="scenarioClass(scenario)"
          >
            {{ displayValue(scenario, grandChildCost.id, USD_METRIC) }}
          </td>
        </tr>
      </template>
      <tr class="boldish no-hover border-bottom-2 border-black">
        <td class="border-0" />
        <td class="border-0 pt-3" colspan="100%">
          Loss of life
        </td>
      </tr>
      <tr
        class="bg-white"
        :class="{ 'fw-medium': !accordioned }"
      >
        <td class="ps-2">
          Total deaths
        </td>
        <td
          v-for="(scenario) in scenariosToDisplay"
          :key="scenario.runId"
          :class="scenarioClass(scenario)"
        >
          {{ `${displayDeaths(scenario)} ${multiScenario ? "" : "deaths"}` }}
        </td>
      </tr>
      <tr
        class="bg-white"
        :class="{ 'fw-medium': !accordioned }"
      >
        <td class="ps-2">
          All age sectors (life years)
        </td>
        <td
          v-for="(scenario) in scenariosToDisplay"
          :key="scenario.runId"
          :class="scenarioClass(scenario)"
        >
          {{ `${displayValue(scenario, 'life_years', LIFE_YEARS_METRIC)} years` }}
        </td>
      </tr>
      <tr
        v-for="ageSectorCost in appStore.getScenarioCostById(props.scenarios[0], LIFE_YEARS_METRIC)?.children"
        v-show="!accordioned"
        :key="ageSectorCost.id"
        class="nested-row fw-lighter"
      >
        <td>{{ appStore.getCostLabel(ageSectorCost.id) }}</td>
        <td
          v-for="(scenario) in scenariosToDisplay"
          :key="scenario.runId"
          :class="scenarioClass(scenario)"
        >
          {{ `${displayValue(scenario, ageSectorCost.id, LIFE_YEARS_METRIC)} years` }}
        </td>
      </tr>
    </tbody>
  </table>
  <VSLModal :scenarios="props.scenarios" />
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "./utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import type { Scenario } from "~/types/storeTypes";
import { diffAgainstBaseline } from "./utils/comparisons";
import { CUMULATIVE_DEATHS_SERIES_ID } from "./Charts/utils/timeSeriesData";

const props = defineProps<{
  scenarios: Scenario[]
  diffing?: boolean
}>();

const accordioned = ref(true);
const appStore = useAppStore();

const multiScenario = computed(() => props.scenarios.length > 1);

const scenariosToDisplay = computed(() => {
  return props.diffing
    ? props.scenarios.filter(s => s.runId !== appStore.baselineScenario?.runId)
    : props.scenarios;
});

const scenarioLabel = (scenario: Scenario) => appStore.getScenarioAxisLabel(scenario);

const displayValue = (scenario: Scenario, costId: string, metricId: string): string | undefined => {
  const cost = appStore.getScenarioCostById(scenario, costId)!;
  const val = props.diffing ? diffAgainstBaseline(cost, metricId) : getValueFromCost(cost, metricId);
  if (val === undefined) {
    return;
  }
  if (metricId !== USD_METRIC) {
    const { amount, unit } = abbreviateMillions(val / 1000_000, true, 1);
    return `${amount}${unit}`;
  }
  switch (appStore.preferences.costBasis) {
    case CostBasis.PercentGDP:
    {
      const percentOfGdp = costAsPercentOfGdp(val, scenario.result.data?.gdp);
      return `${humanReadablePercentOfGdp(percentOfGdp).percent}%`;
    }
    case CostBasis.USD:
    {
      return Math.abs(val) > 10_000
        ? (Math.round(val / 1000) * 1000).toLocaleString()
        : new Intl.NumberFormat("en-US", {
            maximumSignificantDigits: 1,
          }).format(val);
    }
  }
};

const displayDeaths = (scenario: Scenario): string | undefined => {
  const series = scenario.result.data!.time_series[CUMULATIVE_DEATHS_SERIES_ID];
  const totalDeaths = series.at(-1);
  if (totalDeaths === undefined) {
    return;
  }
  if (props.diffing) {
    const baselineSeries = appStore.baselineScenario?.result.data!.time_series[CUMULATIVE_DEATHS_SERIES_ID];
    const baselineTotalDeaths = baselineSeries?.at(-1) || 0;
    if (baselineTotalDeaths === undefined) {
      return;
    }
    const { amount, unit } = abbreviateMillions((totalDeaths - baselineTotalDeaths) / 1000_000, true, 1);
    return `${amount}${unit}`;
  }
  const { amount, unit } = abbreviateMillions(totalDeaths / 1000_000, true, 1);
  return `${amount}${unit}`;
};

const scenarioClass = (scenario: Scenario) => {
  return multiScenario.value && scenario === appStore.baselineScenario ? "text-primary-emphasis" : "";
};
</script>

<style scoped>
tr.nested-row {
  background-color: #f1f3f5;

  td:first-child {
    padding-left: 2.5rem;
  }
}
td {
  padding-left: 0.5rem;
}
td.single-scenario-td {
  width: 70%;
}
.table-hover {
  > tbody > tr.no-hover:hover > * {
    --cui-table-bg-state: transparent;
  }
}
</style>
