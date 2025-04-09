import { TypeOfParameter } from "~/types/parameterTypes";
import type { Parameter, ParameterOption } from "~/types/parameterTypes";
import { paramOptsToSelectOpts } from "~/components/utils/parameters";
import { humanReadableInteger } from "~/components/utils/formatters";

export const useScenarioOptions = (parameterAxis: MaybeRefOrGetter<Parameter | undefined>) => {
  const appStore = useAppStore();

  const axis = computed(() => toValue(parameterAxis));

  const baselineOption = computed(() => {
    if (!appStore.currentScenario.parameters || !axis.value) {
      return undefined;
    } else if (axis.value.parameterType === TypeOfParameter.Numeric) {
      const baselineValue = appStore.currentScenario.parameters[axis.value.id];
      // TODO: (jidea-229) description should say whether the value is a default, min, max; or empty if user-provided.
      return { id: baselineValue, label: humanReadableInteger(baselineValue), description: "" } as ParameterOption;
    } else {
      return axis.value.options?.find((o) => {
        return o.id === appStore.currentScenario.parameters![axis.value!.id];
      });
    }
  });

  const independentParameterName = computed(() => {
    if (axis.value?.updateNumericFrom?.parameterId) {
      return axis.value.updateNumericFrom.parameterId;
    }
  });

  const independentParameterValue = computed(() => {
    if (appStore.currentScenario.parameters && independentParameterName.value) {
      return appStore.currentScenario.parameters[independentParameterName.value];
    }
  });

  const independentParameterLabel = computed(() => {
    if (independentParameterName.value && independentParameterValue.value && appStore.metadata?.parameters) {
      return appStore.metadata?.parameters
        .find(p => p.id === independentParameterName.value)
        ?.options
        ?.find(o => o.id === independentParameterValue.value)
        ?.label;
    }
  });

  const dependentValues = computed(() => {
    if (axis.value?.parameterType === TypeOfParameter.Numeric && axis.value.updateNumericFrom?.parameterId && independentParameterValue.value) {
      return axis.value.updateNumericFrom.values[independentParameterValue.value];
    }
  });

  const defaultNumericOption = computed(() => {
    if (dependentValues.value) {
      const defaultVal = dependentValues.value.default.toString();

      return {
        id: defaultVal,
        label: humanReadableInteger(defaultVal),
        description: `Default for ${independentParameterLabel.value}`,
      } as ParameterOption;
    }
  });

  const predefinedNumericOptions = computed(() => {
    if (dependentValues.value && defaultNumericOption.value) {
      const min = dependentValues.value.min.toString();
      const max = dependentValues.value.max.toString();

      return [
        { id: min, label: humanReadableInteger(min), description: `Minimum for ${independentParameterLabel.value} ` },
        defaultNumericOption.value,
        { id: max, label: humanReadableInteger(max), description: `Maximum for ${independentParameterLabel.value}` },
      ] as ParameterOption[];
    }
  });

  const adjustedNumericOptions = computed(() => {
    if (dependentValues.value && axis.value?.step) {
      const defaultVal = dependentValues.value.default;

      const possibleOptions = [
        { factor: 0.7, description: `30% decrease from default value (to nearest ${axis.value.step})` },
        { factor: 0.8, description: `20% decrease from default value (to nearest ${axis.value.step})` },
        { factor: 0.9, description: `10% decrease from default value (to nearest ${axis.value.step})` },
        { factor: 1.1, description: `10% increase over default value (to nearest ${axis.value.step})` },
        { factor: 1.2, description: `20% increase over default value (to nearest ${axis.value.step})` },
        { factor: 1.3, description: `30% increase over default value (to nearest ${axis.value.step})` },
      ];

      return possibleOptions.map((opt) => {
        const val = defaultVal * opt.factor;
        const roundedVal = Math.round(val / axis.value!.step!) * axis.value!.step!; // Round to nearest e.g. 100

        return {
          id: roundedVal.toString(),
          label: humanReadableInteger(roundedVal.toString()),
          description: opt.description,
        } as ParameterOption;
      }).filter((opt) => {
        const val = Number.parseInt(opt.id);
        return val > dependentValues.value!.min && val < dependentValues.value!.max;
      });
    }
  });

  const nonBaselineOptions = computed(() => {
    if (!axis.value) {
      return [];
    } else if (axis.value.parameterType === TypeOfParameter.Numeric && predefinedNumericOptions.value) {
      const opts = predefinedNumericOptions.value;
      opts.push(...adjustedNumericOptions.value || []);
      return opts.sort((a, b) => {
        return Number.parseInt(a.id) - Number.parseInt(b.id);
      });

      // TODO - exclude any option that is equal to the baseline
    } else {
      return axis.value.options?.filter(({ id }) => {
        return baselineOption.value && id !== baselineOption.value?.id;
      }) || [];
    }
  });

  const nonBaselineSelectOptions = computed(() => {
    return paramOptsToSelectOpts(nonBaselineOptions.value);
  });

  return {
    baselineOption,
    nonBaselineOptions,
    nonBaselineSelectOptions,
    dependentValues,
    defaultNumericOption,
  };
};
