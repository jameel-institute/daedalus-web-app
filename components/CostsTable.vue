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
            <template v-if="index === 0">
              <span v-if="appStore.preferences.costBasis === CostBasis.PercentGDP" class="boldish">
                % of GDP
              </span>
              <div v-else>
                <span class="boldish">
                  $, millions (USD)
                </span>
              </div>
            </template>
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
            :class="scenarioClass(scenario)"
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
          <td class="ps-4 text-nowrap" :class="{ 'single-scenario-td': !multiScenario }">
            {{ appStore.getCostLabel(childCost.id) }}{{ childCost.id === 'life_years' ? '*' : '' }}
          </td>
          <td
            v-for="(scenario) in props.scenarios"
            :key="scenario.runId"
            :class="scenarioClass(scenario)"
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
            :class="scenarioClass(scenario)"
          >
            {{ displayValue(scenario, grandChildCost.id) }}
          </td>
        </tr>
      </template>
    </tbody>
  </table>
  <p class="fw-lighter small mt-auto">
    *Based on an assumed value of statistical life:
    click
    <img
      id="vslInfo"
      role="button"
      class="icon help-icon filter-to-primary p-0"
      src="/icons/info.png"
      @click="() => { modalVisible = true; }"
    >
    for details.
  </p>
  <CModal
    :visible="modalVisible"
    aria-labelledby="vslModalTitle"
    @close="() => { modalVisible = false }"
  >
    <CModalHeader>
      <CModalTitle id="vslModalTitle">
        Value of life years lost
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <p>
        The model behind this dashboard uses the value of statistical life (VSL) approach to estimate the monetary value of lives lost.
      </p>
      <p v-if="vslVariesByScenario">
        The assumed VSLs for the current countries are:
        <span>
          <ul>
            <li v-for="s in scenarios" :key="s.runId">
              {{ `${scenarioLabel(s)}: ${vslLabel(s)}` }}
            </li>
          </ul>
        </span>
      </p>
      <p v-else>
        The assumed VSL for this country is {{ vslLabel(scenarios[0]) }}.
      </p>
      <p>
        {{ scenarios.length > 1 ? 'These values' : 'This value' }}
        can be adjusted if using the <code>DAEDALUS</code> R package directly.
      </p>
      <p class="mb-0">
        The methodology can be found on the
        <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
        <NuxtLink :to="generalDocUrl" target="_blank">general model description</NuxtLink> page,
        <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
        and usage is documented in the <NuxtLink :to="vignetteUrl" target="_blank">'Value of life years lost'</NuxtLink> vignette.
      </p>
    </CModalBody>
  </CModal>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import { costAsPercentOfGdp, humanReadableInteger, humanReadablePercentOfGdp } from "./utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const accordioned = ref(true);
const modalVisible = ref(false);
const appStore = useAppStore();
const generalDocUrl = "https://jameel-institute.github.io/daedalus/articles/info_model_description.html#years-of-life-lost";
const vignetteUrl = "https://jameel-institute.github.io/daedalus/articles/info_life_value.html";

const multiScenario = computed(() => props.scenarios.length > 1);

const scenarioLabel = (scenario: Scenario) => `${appStore.getScenarioAxisLabel(scenario)}`
  + `${scenario === appStore.baselineScenario ? " (baseline)" : ""}`;

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
  const valueInDollarTerms = cost?.values.find(c => c.metric === "usd")?.value;
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
</style>
