import { MAX_COMPARISON_SCENARIOS, MIN_COMPARISON_SCENARIOS } from "~/components/utils/comparisons";

export const useComparisonValidation = (scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>) => {
  const invalid = ref<boolean>(false);
  const feedback = ref<string>();

  watch(scenariosToCompareAgainstBaseline, () => {
    const scenarioOptions = toValue(scenariosToCompareAgainstBaseline);
    invalid.value = false;
    if (scenarioOptions.length + 1 < MIN_COMPARISON_SCENARIOS) {
      invalid.value = true;
      feedback.value = `Please select at least ${MIN_COMPARISON_SCENARIOS - 1} scenario to compare against the baseline.`;
    } else if (scenarioOptions.length + 1 > MAX_COMPARISON_SCENARIOS) {
      invalid.value = true;
      feedback.value = `You can compare up to ${MAX_COMPARISON_SCENARIOS - 1} scenarios against the baseline.`;
    }
  }, { deep: 1, immediate: true });

  return { invalid, feedback };
};
