import { type Parameter, type ParameterOption, TypeOfParameter } from "~/types/parameterTypes";
import { paramOptsToSelectOpts } from "~/components/utils/parameters";

export const useScenarioOptions = (parameterAxis: MaybeRefOrGetter<Parameter | undefined>) => {
  const appStore = useAppStore();

  const baselineOption = computed(() => {
    const axis = toValue(parameterAxis);
    if (!appStore.currentScenario.parameters || !axis) {
      return undefined;
    } else if (axis.parameterType === TypeOfParameter.Numeric) {
      const baselineValue = appStore.currentScenario.parameters[axis.id];
      // TODO: (jidea-229) description should say whether the value is a default, min, max; or empty if user-provided.
      // TODO: (jidea-229) For numeric options, do (locale-based) comma-separation of thousands.
      return { id: baselineValue, label: baselineValue, description: "" } as ParameterOption;
    } else {
      return axis.options?.find((o) => {
        return o.id === appStore.currentScenario.parameters![axis.id];
      });
    }
  });

  const nonBaselineOptions = computed(() => {
    return toValue(parameterAxis)?.options?.filter(({ id }) => {
      return baselineOption.value && id !== baselineOption.value?.id;
    }) || [];
  });

  const nonBaselineSelectOptions = computed(() => {
    return paramOptsToSelectOpts(nonBaselineOptions.value);
  });

  return {
    baselineOption,
    nonBaselineOptions,
    nonBaselineSelectOptions,
  };
};
