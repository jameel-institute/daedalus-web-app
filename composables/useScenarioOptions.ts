import { type Parameter, type ParameterOption, TypeOfParameter } from "~/types/parameterTypes";
import { type ParameterSelectOption, paramOptsToSelectOpts } from "~/components/utils/parameters";

export const useScenarioOptions = (parameterAxis: MaybeRefOrGetter<Parameter | undefined>) => {
  const appStore = useAppStore();

  const baselineOption = ref<ParameterOption>();
  const nonBaselineOptions = ref<ParameterOption[]>([]);
  const nonBaselineSelectOptions = ref<ParameterSelectOption[]>([]);

  watchEffect(() => {
    const axis = toValue(parameterAxis);

    if (!appStore.currentScenario.parameters) {
      baselineOption.value = undefined;
    } else if (axis?.parameterType === TypeOfParameter.Numeric) {
      const baselineValue = appStore.currentScenario.parameters[axis.id];
      // TODO: (jidea-229) description should say whether the value is a default, min, max; or empty if user-provided.
      // TODO: (jidea-229) For numeric options, do (locale-based) comma-separation of thousands.
      return { id: baselineValue, label: baselineValue, description: "" } as ParameterOption;
    } else {
      baselineOption.value = axis?.options?.find((o) => {
        return o.id === appStore.currentScenario.parameters![axis.id];
      });
    }

    nonBaselineOptions.value = axis?.options?.filter(({ id }) => {
      return baselineOption.value && id !== baselineOption.value?.id;
    }) || [];

    nonBaselineSelectOptions.value = paramOptsToSelectOpts(nonBaselineOptions.value);
  });

  return {
    baselineOption,
    nonBaselineOptions,
    nonBaselineSelectOptions,
  };
};
