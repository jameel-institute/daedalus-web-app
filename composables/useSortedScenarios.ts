import { sortOptions } from "~/components/utils/parameters";
import type { Scenario } from "~/types/storeTypes";

export default (scenarios: MaybeRefOrGetter<Scenario[]>) => {
  const appStore = useAppStore();

  const sortedScenarios = computed(() => {
    const scens = toValue(scenarios);
    if (scens.length === 1) {
      return scens;
    }
    if (!appStore.axisMetadata) {
      return scens;
    }
    const scenarioAxisValues = scens.map(s => appStore.getScenarioAxisValue(s)).filter(o => o !== undefined);
    const sortedOptions = sortOptions(appStore.axisMetadata, scenarioAxisValues);
    scens.sort((a, b) => {
      const aValue = appStore.getScenarioAxisValue(a)!;
      const bValue = appStore.getScenarioAxisValue(b)!;
      return sortedOptions.indexOf(aValue) - sortedOptions.indexOf(bValue);
    });
    return scens;
  });

  return { sortedScenarios };
};
