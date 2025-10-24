<template>
  <p class="fw-lighter small ms-auto mt-auto">
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
        {{ vslVariesByScenario ? 'These values' : 'This value' }}
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

<script setup lang="ts">
import type { Scenario } from "~/types/storeTypes";
import { commaSeparatedNumber } from "./utils/formatters";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const appStore = useAppStore();
const modalVisible = ref(false);
const generalDocUrl = "https://jameel-institute.github.io/daedalus/articles/info_model_description.html#years-of-life-lost";
const vignetteUrl = "https://jameel-institute.github.io/daedalus/articles/info_life_value.html";

const vslVariesByScenario = computed(() => {
  return props.scenarios.some(scenario => appStore.getScenarioLifeValue(scenario) !== appStore.getScenarioLifeValue(props.scenarios[0]));
});

const vslLabel = (scenario: Scenario) => {
  const vsl = appStore.getScenarioLifeValue(scenario);
  return `${commaSeparatedNumber(vsl)} Int'l$`;
};

const scenarioLabel = (scenario: Scenario) => `${appStore.getScenarioAxisLabel(scenario)}`
  + `${scenario === appStore.baselineScenario ? " (baseline)" : ""}`;
</script>
