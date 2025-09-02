import type { DisplayInfo, TimeSeriesGrouping } from "~/types/apiResponseTypes";

// Given the metadata for a time series *group* (that is, a collection of related time series, likely two)
// and a boolean indicating whether to use daily or cumulative ('total') data,
// return the active role (daily/total) and the metadata for the corresponding time series itself.
export default (seriesGroup: MaybeRefOrGetter<TimeSeriesGrouping>, isDaily: MaybeRefOrGetter<boolean>) => {
  const appStore = useAppStore();

  const activeRole = computed(() => appStore.metadata?.results.time_series_roles.map(r => r.id)
    .find(roleId => toValue(isDaily) ? roleId === "daily" : roleId !== "daily"),
  );

  const activeSeriesMetadata = computed((): DisplayInfo | undefined => {
    if (!activeRole.value) {
      return;
    }
    const activeTimeSeriesId = toValue(seriesGroup).time_series[activeRole.value];
    return appStore.metadata?.results.time_series?.find(({ id }) => id === activeTimeSeriesId);
  });

  return {
    activeRole,
    activeSeriesMetadata,
  };
};
