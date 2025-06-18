import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";

export default (scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>) => {
  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length < MIN_SCENARIOS_COMPARED_TO_BASELINE);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length > MAX_SCENARIOS_COMPARED_TO_BASELINE);
  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value;
  });
  const feedback = computed(() => {
    if (tooFewScenarios.value) {
      return `Please select at least ${MIN_SCENARIOS_COMPARED_TO_BASELINE} scenario to compare against the baseline.`;
    } else if (tooManyScenarios.value) {
      return `You can compare up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} scenarios against the baseline.`;
    }
  });

  return { invalid, feedback };
};
