import { type Parameter, type ParameterOption, TypeOfParameter } from "~/types/parameterTypes";
import { getRangeForDependentParam, paramOptsToSelectOpts } from "~/components/utils/parameters";
import { humanReadableInteger } from "~/components/utils/formatters";

export default (parameterAxis: MaybeRefOrGetter<Parameter | undefined>) => {
  const appStore = useAppStore();

  const axis = computed(() => toValue(parameterAxis));

  const baselineOption = computed(() => {
    if (!appStore.currentScenario.parameters || !axis.value) {
      return undefined;
    } else if (axis.value.parameterType === TypeOfParameter.Numeric) {
      const baselineValue = appStore.currentScenario.parameters[axis.value.id];
      // TODO: (jidea-229) description should say whether the value is a default, min, max; or empty if user-provided.
      return { id: baselineValue, label: humanReadableInteger(baselineValue), description: "" } as ParameterOption;
    } else if (axis.value.id && appStore.currentScenario.parameters) {
      return axis.value.options?.find(o => o.id === appStore.currentScenario.parameters![axis.value!.id]);
    }
  });

  const dependedOnParamLabel = computed(() => {
    const dependedOnParamId = axis.value?.updateNumericFrom?.parameterId;
    const dependedOnParamValue = dependedOnParamId ? appStore.currentScenario.parameters?.[dependedOnParamId] : undefined;
    if (dependedOnParamId && dependedOnParamValue && appStore.metadata?.parameters) {
      return appStore.metadata?.parameters
        .find(p => p.id === dependedOnParamId)
        ?.options
        ?.find(o => o.id === dependedOnParamValue)
        ?.label;
    }
  });

  const predefinedNumericOptions = computed(() => {
    const dependentRange = getRangeForDependentParam(axis.value, appStore.currentScenario.parameters);

    if (dependentRange) {
      const min = dependentRange.min.toString();
      const defaultVal = dependentRange.default.toString();
      const max = dependentRange.max.toString();

      return [
        { id: min, label: humanReadableInteger(min), description: `Minimum for ${dependedOnParamLabel.value}` },
        { id: defaultVal, label: humanReadableInteger(defaultVal), description: `Default for ${dependedOnParamLabel.value}` },
        { id: max, label: humanReadableInteger(max), description: `Maximum for ${dependedOnParamLabel.value}` },
      ] as ParameterOption[];
    }
  });

  const nonBaselineOptions = computed(() => {
    if (!axis.value) {
      return [];
    }
    if (axis.value?.parameterType === TypeOfParameter.Numeric) {
      return predefinedNumericOptions.value?.filter(o => o.id !== baselineOption.value?.id) || [];
      // TODO - exclude any option that is equal to the baseline?
    }
    return axis.value?.options?.filter(({ id }) => {
      return baselineOption.value && id !== baselineOption.value?.id;
    }) || [];
  });

  const nonBaselineSelectOptions = computed(() => {
    return paramOptsToSelectOpts(nonBaselineOptions.value);
  });

  return {
    baselineOption,
    dependedOnParamLabel,
    nonBaselineOptions,
    nonBaselineSelectOptions,
  };
};
