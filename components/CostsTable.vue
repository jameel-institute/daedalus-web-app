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
          v-for="(scenario, index) in props.scenarios"
          :key="scenario.runId"
        >
          <div class="d-flex flex-column">
            <span v-if="index === 0" class="boldish">
              {{ unitHeaderText }}
            </span>
            <span v-if="multiScenario" class="fw-medium">
              {{ scenarioLabel(scenario) }}
            </span>
          </div>
        </th>
      </tr>
    </thead>
    <tbody id="costs-table-body">
      <template v-if="multiScenario">
        <tr class="bg-white fw-medium">
          <td class="ps-2">
            Total losses
          </td>
          <td
            v-for="(scenario) in props.scenarios"
            :key="scenario.runId"
          >
            {{ displayValue(scenario, 'total') }}
          </td>
        </tr>
      </template>
      <template
        v-for="(childCost) in appStore.getScenarioTotalCost(props.scenarios[0])?.children"
        :key="childCost.id"
      >
        <tr>
          <td class="ps-4 text-nowrap" :class="(multiScenario ? '' : 'single-scenario-td')">
            {{ appStore.getCostLabel(childCost.id) }}
            <span v-if="childCost.id === 'life_years'">
              <TooltipHelp
                :help-text="vslVariesByScenario
                  ? undefined
                  : `${vslFull}: ${vslLabel(scenarios[0])}`"
                :list-header="vslVariesByScenario
                  ? `${vslFull}:`
                  : undefined"
                :list-items="vslVariesByScenario
                  ? scenarios.map((s) => `${scenarioLabel(s)}: ${vslLabel(s)}`)
                  : undefined"
                :classes="['ms-1']"
                :info-icon="true"
              />
            </span>
          </td>
          <td
            v-for="(scenario) in props.scenarios"
            :key="scenario.runId"
          >
            {{ displayValue(scenario, childCost.id) }}
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
            v-for="(scenario) in props.scenarios"
            :key="scenario.runId"
          >
            {{ displayValue(scenario, grandChildCost.id) }}
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import { costAsPercentOfGdp, gdpReferenceYear, humanReadableInteger, humanReadablePercentOfGdp } from "./utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import type { Scenario } from "~/types/storeTypes";
import { getScenarioLabel } from "./utils/comparisons";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const accordioned = ref(true);
const appStore = useAppStore();
const vslFull = "Value of statistical life";

const multiScenario = computed(() => props.scenarios.length > 1);
const unitHeaderText = computed(() => {
  return appStore.preferences.costBasis === CostBasis.PercentGDP
    ? `% of ${gdpReferenceYear} GDP`
    : "$, millions";
});

const scenarioLabel = (scenario: Scenario) => {
  const axisVal = appStore.getScenarioAxisValue(scenario);
  if (axisVal) {
    const label = getScenarioLabel(axisVal, appStore.axisMetadata);
    return `${label}${scenario === appStore.baselineScenario ? " (baseline)" : ""}`;
  }
};

const vslVariesByScenario = computed(() => {
  return props.scenarios.some(scenario => appStore.getScenarioLifeValue(scenario) !== appStore.getScenarioLifeValue(props.scenarios[0]));
});

const vslLabel = (scenario: Scenario) => {
  const vsl = appStore.getScenarioLifeValue(scenario);
  return `${humanReadableInteger(vsl)} Int'l$`;
};

const displayValue = (scenario: Scenario, costId: string): string | undefined => {
  const totalCost = appStore.getScenarioTotalCost(scenario);
  let cost = costId === "total" ? totalCost : totalCost?.children?.find(c => c.id === costId);
  if (!cost) {
    cost = totalCost?.children?.map(c => c.children).flat().find((grandChild) => {
      return !!grandChild && grandChild.id === costId;
    });
  }
  const valueInDollarTerms = cost?.value;
  if (valueInDollarTerms === undefined) {
    return;
  }
  switch (appStore.preferences.costBasis) {
    case CostBasis.PercentGDP:
    {
      const percentOfGdp = costAsPercentOfGdp(valueInDollarTerms, scenario.result.data?.gdp);
      return `${humanReadablePercentOfGdp(percentOfGdp).percent}%`;
    }
    case CostBasis.USD:
    {
      return valueInDollarTerms > 10_000
        ? (Math.round(valueInDollarTerms / 1000) * 1000).toLocaleString()
        : new Intl.NumberFormat("en-US", {
            maximumSignificantDigits: 1,
          }).format(valueInDollarTerms);
    }
  }
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
</style>
