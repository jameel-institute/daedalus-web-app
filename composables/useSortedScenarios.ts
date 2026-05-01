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
    const missingRank = sortedOptions.length;
    const sorted = [...scens];
    sorted.sort((a, b) => {
      const aValue = appStore.getScenarioAxisValue(a)!;
      const bValue = appStore.getScenarioAxisValue(b)!;
      const aIndex = sortedOptions.indexOf(aValue);
      const bIndex = sortedOptions.indexOf(bValue);
      const aRank = aIndex >= 0 ? aIndex : missingRank;
      const bRank = bIndex >= 0 ? bIndex : missingRank;
      return aRank - bRank;
    });
    return sorted;
  });

  return { sortedScenarios };
};
