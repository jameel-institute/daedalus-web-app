import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import { humanReadableInteger } from "~/components/utils/formatters";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

export default (scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>, parameter: MaybeRefOrGetter<Parameter | undefined>) => {
  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length < MIN_SCENARIOS_COMPARED_TO_BASELINE);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length > MAX_SCENARIOS_COMPARED_TO_BASELINE);

  const scenariosWhichAreNotValidNumbers = computed(() => {
    return toValue(scenariosToCompareAgainstBaseline).filter((val: string) => Number.parseInt(val).toString() !== val);
  });
  const invalidNumericParameter = computed(() => {
    return toValue(parameter)?.parameterType === TypeOfParameter.Numeric && scenariosWhichAreNotValidNumbers.value.length > 0;
  });

  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value || invalidNumericParameter.value;
  });
  const feedback = computed(() => {
    if (tooFewScenarios.value) {
      return `Please select at least ${MIN_SCENARIOS_COMPARED_TO_BASELINE} scenario to compare against the baseline.`;
    } else if (tooManyScenarios.value) {
      return `You can compare up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} scenarios against the baseline.`;
    } else if (invalidNumericParameter.value) {
      const invalids = scenariosWhichAreNotValidNumbers.value.map((val: string) => humanReadableInteger(val));
      return `Some of the selected scenarios are not valid numbers: ${invalids.join(", ")}.`;
    }
  });

  return { invalid, feedback };
};
