import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import { numericValueInvalid } from "~/components/utils/parameters";
import type { Parameter } from "~/types/parameterTypes";

export default (
  scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>,
  parameter: MaybeRefOrGetter<Parameter | undefined>,
) => {
  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length < MIN_SCENARIOS_COMPARED_TO_BASELINE);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length > MAX_SCENARIOS_COMPARED_TO_BASELINE);
  const numericInvalid = computed(() => {
    const param = toValue(parameter);

    return param
      && toValue(scenariosToCompareAgainstBaseline).filter((val: string) => numericValueInvalid(val, param)).length > 0;
  });
  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value || numericInvalid.value;
  });

  return { tooFewScenarios, tooManyScenarios, numericInvalid, invalid };
};
