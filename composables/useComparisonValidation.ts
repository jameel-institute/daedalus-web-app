import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

export default (
  scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>,
  parameter: MaybeRefOrGetter<Parameter | undefined>,
) => {
  const parameterIsNumeric = computed(() => toValue(parameter)?.parameterType === TypeOfParameter.Numeric);
  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length < MIN_SCENARIOS_COMPARED_TO_BASELINE);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length > MAX_SCENARIOS_COMPARED_TO_BASELINE);
  const numericInvalid = computed(() => {
    if (!parameterIsNumeric.value) {
      return false;
    }

    const invalidNumerics = toValue(scenariosToCompareAgainstBaseline).filter((val: string) => {
      return Number.isNaN(Number(val)) || Number(val) < 0;
    });

    return invalidNumerics.length > 0;
  });
  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value || numericInvalid.value;
  });

  return { tooFewScenarios, tooManyScenarios, numericInvalid, invalid };
};
