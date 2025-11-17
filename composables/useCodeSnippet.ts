import { type ParameterSet, TypeOfParameter } from "~/types/parameterTypes";
import type { Scenario } from "~/types/storeTypes";

// Values copied from https://github.com/jameel-institute/daedalus.api/blob/main/R/behaviour.R
// Note that the mapping from the options text to the optimism parameter
// is reversed: for an option of 'low', optimism is high. This allows
// the parameter label to present as 'change in public behaviour'.
const OPTIMISM = Object.freeze({
  low: 0.75,
  medium: 0.5,
  high: 0.25,
}) as Record<string, number>;

// Values copied from https://github.com/jameel-institute/daedalus.api/blob/main/R/constants.R
const BEHAV_RESPONSIVENESS_K2 = 0.01;
const BEHAV_EFFECTIVENESS_DELTA = 0.2;

const countryObjRCode = (params: ParameterSet, scenarioTag: string) => {
  return `${scenarioTag}_country_obj <- daedalus::daedalus_country("${params.country}")\n`
    + `${scenarioTag}_country_obj$hospital_capacity <- ${params.hospital_capacity}\n\n`;
};

const behaviourObjRCode = (scenario: Scenario, indentation: string) => {
  if (scenario.parameters?.behaviour === "none") {
    return `NULL`;
  }
  return [
    `daedalus::daedalus_new_behaviour(`,
    `  hospital_capacity = ${scenario.parameters?.hospital_capacity},`,
    `  baseline_optimism = ${OPTIMISM[scenario.parameters?.behaviour ?? ""]},`,
    `  responsiveness = ${BEHAV_RESPONSIVENESS_K2},`,
    `  behav_effectiveness = ${BEHAV_EFFECTIVENESS_DELTA}`,
    `)`,
  ].join(`\n${indentation}`);
};

// TODO: (jidea-317) In the future, we should have the R API capture the actual call made to the model,
// returning it as part of the result response, so that it can be displayed here verbatim.
// In that way, we'd avoid two things:
// (1) replicating logic or constants from the R API package here,
// (2) the risk of the code snippet generation being out of date with respect to the current model interface.
export default (
  scenariosRef: MaybeRefOrGetter<Scenario[]>,
  generateCodeSnippet: Ref<boolean>,
) => {
  const appStore = useAppStore();

  const scenariosVaryBy = (parameterId: string) => toValue(scenariosRef).some((scenario, _, arr) =>
    scenario.parameters?.[parameterId] !== arr[0].parameters?.[parameterId],
  );

  // A tag to append to variable names to make sure variables have unique, readable, valid names.
  const scenarioTag = (scenario: Scenario) => {
    const axisId = appStore.currentComparison.axis as string;
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

  const codeSnippet = computed(() => {
    if (!generateCodeSnippet.value) {
      return;
    }
    const scenarios = toValue(scenariosRef);
    const allScenariosHaveNoneBehaviour = scenarios.every(scenario => scenario.parameters?.behaviour === "none");
    // Determine if we can share a single behaviour_obj across all scenarios
    const useSharedBehaviourObj = !scenariosVaryBy("behaviour") && !scenariosVaryBy("hospital_capacity") && !allScenariosHaveNoneBehaviour;
    const useSharedCountryObj = scenarios.length === 1 || (!scenariosVaryBy("country") && !scenariosVaryBy("hospital_capacity"));

    const scenariosCode = scenarios.map((s) => {
      const params = s.parameters as ParameterSet;
      const sTag = scenarioTag(s) ?? "";
      const modelResultVarName = [sTag, "model_result"].filter(t => !!t).join("_");

      const modelCall = [
        `${modelResultVarName} <- daedalus::daedalus(`,
        `  ${useSharedCountryObj ? `country_obj` : `${sTag}_country_obj`},`,
        `  "${params.pathogen}",`,
        `  response_strategy = "${params.response}",`,
        `  vaccine_investment = "${params.vaccine}",`,
        `  ${useSharedBehaviourObj ? `behaviour_obj` : `behaviour = ${behaviourObjRCode(s, "  ")}`}`,
        `)`,
      ].join("\n");

      return [
        useSharedCountryObj ? null : countryObjRCode(params, sTag),
        modelCall,
      ].join("");
    }).join("\n\n");

    const sharedCountryObj = `country_obj <- daedalus::daedalus_country("${scenarios[0].parameters?.country}")\n`
      + `country_obj$hospital_capacity <- ${scenarios[0].parameters?.hospital_capacity}\n\n`;
    return [
      useSharedCountryObj ? sharedCountryObj : null,
      useSharedBehaviourObj ? `behaviour_obj <- ${behaviourObjRCode(scenarios[0], "")}\n\n` : null,
      scenariosCode,
    ].join("");
  });

  return { codeSnippet };
};
