import { MAX_COMPARISON_SCENARIOS, MIN_COMPARISON_SCENARIOS } from "~/components/utils/comparisons";

export const useComparisonValidation = (scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>) => {
  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length + 1 < MIN_COMPARISON_SCENARIOS);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length + 1 > MAX_COMPARISON_SCENARIOS);
  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value;
  });
  const feedback = computed(() => {
    if (tooFewScenarios.value) {
      return `Please select at least ${MIN_COMPARISON_SCENARIOS - 1} scenario to compare against the baseline.`;
    } else if (tooManyScenarios.value) {
      return `You can compare up to ${MAX_COMPARISON_SCENARIOS - 1} scenarios against the baseline.`;
    }
  });

  return { invalid, feedback };
};
