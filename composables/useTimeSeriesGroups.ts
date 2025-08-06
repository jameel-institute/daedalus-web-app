import type { DisplayInfo, TimeSeriesGroup } from "~/types/apiResponseTypes";

// Given the metadata for a time series *group* (that is, a collection of related time series, likely two)
// and a boolean indicating whether to use daily or cumulative ('total') data,
// return the active role (daily/total) and the metadata for the corresponding time series itself.
export default (seriesGroup: MaybeRefOrGetter<TimeSeriesGroup>, isDaily: MaybeRefOrGetter<boolean>) => {
  const appStore = useAppStore();

  const activeRole = computed(() => {
    // Since we are using a switch UI, we assume there are only two roles, and "total" role precedes "daily" role
    const timeSeriesGroupRoles = Object.keys(toValue(seriesGroup).time_series).slice(0, 2); // ["total", "daily"]
    return timeSeriesGroupRoles[Number(toValue(isDaily))];
  });

  const activeSeriesMetadata = computed((): DisplayInfo | undefined => {
    const activeTimeSeriesId = toValue(seriesGroup).time_series[activeRole.value];
    return appStore.allTimeSeriesMetadata?.find(({ id }) => id === activeTimeSeriesId);
  });

  return {
    activeRole,
    activeSeriesMetadata,
  };
};
