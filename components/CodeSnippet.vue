<template>
  <div class="d-inline-block">
    <div v-if="codeSnippet">
      <CTooltip content="Generate code snippet" placement="top">
        <template #toggler="{ togglerId, on }">
          <CButton
            id="btn-code-snippet"
            color="light"
            :aria-describedby="togglerId"
            aria-label="Generate code snippet"
            class="btn-scenario-header"
            v-on="on"
            @click="() => { modalVisible = true; }"
          >
            <CIcon icon="cilCode" size="lg" class="text-muted" />
          </CButton>
        </template>
      </CTooltip>
      <CModal
        :visible="modalVisible"
        aria-labelledby="codeSnippetModalTitle"
        @close="() => { modalVisible = false }"
      >
        <CModalHeader>
          <CModalTitle id="codeSnippetModalTitle">
            DAEDALUS code snippet
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Use this R code snippet to run the model directly with the daedalus package for the current parameters.
            See the
            <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
            <NuxtLink to="https://jameel-institute.github.io/daedalus/" target="_blank">daedalus documentation</NuxtLink> for
            installation instructions and further details.
          </p>
          <div class="code p-3">
            <button
              id="btn-copy-code"
              class="btn btn-clipboard"
              :class="copied ? 'btn-copied' : ''"
              aria-label="Copy code snippet"
              @click="copySnippet"
              @blur="resetCopied"
              @mouseleave="resetCopied"
            >
              {{ copied ? "Copied!" : "Copy" }}
            </button>
            <pre>{{ codeSnippet }}</pre>
          </div>
        </CModalBody>
      </CModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import { type ParameterSet, TypeOfParameter } from "~/types/parameterTypes";
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const appStore = useAppStore();

const modalVisible = ref(false);
const copied = ref(false);

defineExpose({ modalVisible });

// In the future, we should have the R API capture the actual call made to the model,
// returning it as part of the result response, so that it can be displayed here verbatim.
// In that way, we'd avoid two things:
// (1) replicating logic or constants from the R API package here,
// (2) the risk of the code snippet generation being out of date with respect to the current model interface.

// Values copied from https://github.com/jameel-institute/daedalus.api/blob/main/R/behaviour.R
const OPTIMISM = Object.freeze({
  low: 0.75,
  medium: 0.5,
  high: 0.25,
}) as Record<string, number>;

// Values copied from https://github.com/jameel-institute/daedalus.api/blob/main/R/constants.R
const BEHAV_RESPONSIVENESS_K2 = 0.01;
const BEHAV_EFFECTIVENESS_DELTA = 0.2;

const scenariosVaryBy = (parameterId: string) => props.scenarios.some((scenario, _, arr) =>
  scenario.parameters?.[parameterId] !== arr[0].parameters?.[parameterId],
);

// A tag to append to variable names to make sure variables have unique, readable, valid names.
const scenarioTag = (scenario: Scenario) => {
  const axisId = appStore.currentComparison.axis;
  if (!axisId) {
    return;
  }
  const axisVal = appStore.getScenarioAxisValue(scenario)?.toLocaleLowerCase();
  // For disambiguation, we need to include the axis param ID if it's vaccine or behaviour, since
  // both those parameters take the same options (none, low, medium, high).
  // R variable names must not start with a number (so we should begin variable names with the axis if its values may be numeric).
  if (["vaccine", "behaviour"].includes(axisId) || appStore.axisMetadata?.parameterType === TypeOfParameter.Numeric) {
    return `${axisId}_${axisVal}`;
  } else {
    return axisVal;
  }
};

const behaviourObj = (scenario: Scenario, indentation: string) => {
  if (scenario.parameters!.behaviour === "none") {
    return `NULL`;
  }
  return [
    `daedalus::daedalus_new_behaviour(`,
    `  hospital_capacity = ${scenario.parameters!.hospital_capacity},`,
    `  baseline_optimism = ${OPTIMISM[scenario.parameters!.behaviour]},`,
    `  responsiveness = ${BEHAV_RESPONSIVENESS_K2},`,
    `  behav_effectiveness = ${BEHAV_EFFECTIVENESS_DELTA}`,
    `)`,
  ].join(`\n${indentation}`);
};

const codeSnippet = computed(() => {
  if (!props.scenarios.every(scenario => !!scenario.parameters)) {
    return;
  }
  let modelResultVarName = `model_result`;
  const allScenariosHaveNoneBehaviour = props.scenarios.every(scenario => scenario.parameters?.behaviour === "none");
  // Determine if we can share a single behaviour_obj across all scenarios
  const sharedBehaviourObj = props.scenarios.length > 1
    && !scenariosVaryBy("behaviour")
    && !scenariosVaryBy("hospital_capacity")
    && !allScenariosHaveNoneBehaviour
    ? `behaviour_obj <- ${behaviourObj(props.scenarios[0], "")}\n\n`
    : null;
  const sharedCountryObj = props.scenarios.length === 1
    || (!scenariosVaryBy("country") && !scenariosVaryBy("hospital_capacity"))
    ? `country_obj <- daedalus::daedalus_country("${props.scenarios[0].parameters!.country}")\n`
    + `country_obj$hospital_capacity <- ${props.scenarios[0].parameters!.hospital_capacity}\n\n`
    : null;

  const scenariosCode = props.scenarios.map((s) => {
    const p = s.parameters as ParameterSet;
    const sTag = scenarioTag(s);

    let countryObjCode;
    let countryObjVarName;
    if (sharedCountryObj) {
      countryObjVarName = `country_obj`;
    } else {
      countryObjVarName = `${sTag}_country_obj`;
      countryObjCode = `${countryObjVarName} <- daedalus::daedalus_country("${p.country}")\n`
        + `${countryObjVarName}$hospital_capacity <- ${p.hospital_capacity}\n\n`;
    }

    if (props.scenarios.length > 1) {
      modelResultVarName = `${sTag}_model_result`;
    }
    const modelCall = [
      `${modelResultVarName} <- daedalus::daedalus(`,
      `  ${sharedBehaviourObj ? `country_obj` : countryObjVarName},`,
      `  "${p.pathogen}",`,
      `  response_strategy = "${p.response}",`,
      `  vaccine_investment = "${p.vaccine}",`,
      `  ${sharedBehaviourObj ? `behaviour_obj` : `behaviour = ${behaviourObj(s, "  ")}`}`,
      `)`,
    ].join("\n");

    return [countryObjCode, modelCall].join("");
  }).join("\n\n");

  return [sharedCountryObj, sharedBehaviourObj, scenariosCode].join("");
});

const copySnippet = () => {
  if (codeSnippet.value) {
    navigator.clipboard.writeText(codeSnippet.value);
    copied.value = true;
  };
};

const resetCopied = () => {
  // Add a little timeout so text is readable on immediate unhover
  setTimeout(() => {
    copied.value = false;
  }, 1500);
};
</script>

<style lang="scss" scoped>
  .code {
    background-color: var(--cui-tertiary-bg);
    position: relative;
  }

  .btn-clipboard {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.8rem;
      border-radius: 0.25rem;
      padding: 0.25rem;
    &:hover {
      color: var(--cui-light);
      background-color: var(--cui-primary);
    }
  }

  .btn-copied {
    background-color: var(--cui-secondary-bg-dark)!important;
    color: var(--cui-light)!important;
  }
</style>
