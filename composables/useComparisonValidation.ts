import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import { humanReadableInteger } from "~/components/utils/formatters";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

// TODO: Be less strict about out-of-range numeric options: these should probably trigger warnings only. This applies to ParameterForm also.
export default (
  scenariosToCompareAgainstBaseline: MaybeRefOrGetter<Array<string>>,
  parameter: MaybeRefOrGetter<Parameter | undefined>,
) => {
  const appStore = useAppStore();
  const parameterIsNumeric = computed(() => toValue(parameter)?.parameterType === TypeOfParameter.Numeric);

  const tooFewScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length < MIN_SCENARIOS_COMPARED_TO_BASELINE);
  const tooManyScenarios = computed(() => toValue(scenariosToCompareAgainstBaseline).length > MAX_SCENARIOS_COMPARED_TO_BASELINE);

  const NaNScenarios = computed(() => {
    return toValue(scenariosToCompareAgainstBaseline).filter((val: string) => Number.parseInt(val).toString() !== val);
  });
  const someNumericOptionsAreNaN = computed(() => parameterIsNumeric.value && NaNScenarios.value.length > 0);

  const dependedOnParamId = computed(() => toValue(parameter)?.updateNumericFrom?.parameterId);
  const dependedOnParamValue = computed(() => dependedOnParamId.value ? appStore.currentScenario.parameters?.[dependedOnParamId.value] : undefined);
  const dependentValues = computed(() => dependedOnParamValue.value ? toValue(parameter)?.updateNumericFrom?.values[dependedOnParamValue.value] : undefined);
  const dependedOnParamLabel = computed(() => {
    if (dependedOnParamId.value && dependedOnParamValue.value && appStore.metadata?.parameters) {
      return appStore.metadata?.parameters
        .find(p => p.id === dependedOnParamId.value)
        ?.options
        ?.find(o => o.id === dependedOnParamValue.value)
        ?.label;
    }
  });
  const outOfRangeNumericOptions = computed(() => {
    if (dependentValues.value === undefined) {
      return [];
    }
    return toValue(scenariosToCompareAgainstBaseline)
      .map(Number.parseInt)
      .filter((val: number) => val < dependentValues.value!.min || val > dependentValues.value!.max);
  });
  const someNumericOptionsOutOfRange = computed(() => {
    return parameterIsNumeric.value && outOfRangeNumericOptions.value.length > 0;
  });

  const invalid = computed(() => {
    return tooFewScenarios.value || tooManyScenarios.value || someNumericOptionsAreNaN.value || someNumericOptionsOutOfRange.value;
  });
  // TODO - refactor this whole file / ParameterForm so that they use shared logic around dependent parameters.
  // useScenarioOptions will also probably want to use this logic, so it should be moved to a shared composable. cf https://github.com/jameel-institute/daedalus-web-app/pull/111/files
  const feedback = computed(() => {
    if (tooFewScenarios.value) {
      return `Please select at least ${MIN_SCENARIOS_COMPARED_TO_BASELINE} scenario to compare against the baseline.`;
    } else if (tooManyScenarios.value) {
      return `You can compare up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} scenarios against the baseline.`;
    } else if (someNumericOptionsAreNaN.value) {
      const invalids = NaNScenarios.value.map((val: string) => humanReadableInteger(val));
      return `Some of the selected scenarios are not valid numbers: ${invalids.join(", ")}.`;
    } else if (someNumericOptionsOutOfRange.value && dependentValues.value) {
      return `${dependentValues.value.min} to ${dependentValues.value.max} is the allowed ${toValue(parameter)?.label.toLowerCase()} range for ${dependedOnParamLabel.value}.`;
    }
  });

  return { invalid, feedback };
};
