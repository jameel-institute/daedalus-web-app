<template>
  <div>
    <CFormLabel>Show losses:</CFormLabel>
    <div v-if="appStore.preferences">
      <CFormCheck
        id="costBasisGdp"
        v-model="appStore.preferences.costBasis"
        :inline="true"
        type="radio"
        label="as % of pre-pandemic GDP"
        :value="CostBasis.PercentGDP"
      />
      <CFormCheck
        id="costBasisUsd"
        v-model="appStore.preferences.costBasis"
        :inline="true"
        type="radio"
        label="in USD"
        :value="CostBasis.USD"
      >
        <template #label>
          <span>
            in {{ gdpReferenceYear }} USD
            <TooltipHelp
              :help-text="gdpVariesByScenario
                ? undefined
                : `USD values based on ${gdpReferenceYear} GDP of ${scenarioGdpLabel(scenarios[0])}`
              "
              :list-header="gdpVariesByScenario
                ? `USD values based on ${gdpReferenceYear} GDPs:`
                : undefined"
              :list-items="gdpVariesByScenario
                ? scenarios.map((s) => `${scenarioLabel(s)}: ${scenarioGdpLabel(s)}`)
                : undefined"
              :classes="['ms-1']"
              :info-icon="true"
            />
          </span>
        </template>
      </CFormCheck>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CostBasis } from "~/types/unitTypes";
import { gdpReferenceYear } from "@/components/utils/formatters";
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const appStore = useAppStore();

const gdpVariesByScenario = computed(() => {
  return props.scenarios.some(scenario => scenario.result.data?.gdp !== props.scenarios[0].result.data?.gdp);
});

const scenarioGdpLabel = (scenario: Scenario) => {
  const gdp = scenario.result.data?.gdp;
  if (!gdp) {
    return;
  }
  const { amount, unit } = expressMillionsDollarsAsBillions(gdp, 1);
  return `$${amount} ${unit}`;
};

const scenarioLabel = (scenario: Scenario) => `${appStore.getScenarioAxisLabel(scenario)}`
  + `${scenario === appStore.baselineScenario ? " (baseline)" : ""}`;
</script>
