export default () => {
  const appStore = useAppStore();

  // Use computed to sync with persisted preferences
  const openedAccordions = computed({
    get: () => appStore.preferences.openedTimeSeriesAccordions,
    set: (value: string[]) => {
      appStore.preferences.openedTimeSeriesAccordions = value;
    },
  });

  const accordionBodyYPadding = 8;
  const minAccordionHeight = 145;
  const maxAccordionHeight = 400;
  const minTotalAccordionHeight = 500;
  const minChartHeightPx = minAccordionHeight - 2 * accordionBodyYPadding;

  // Share available height equally between open accordions. Avoid division by zero.
  const chartHeightPx = computed(() => {
    const maxTotalAccordionHeight = appStore.timeSeriesGroups
      ? Object.keys(appStore.timeSeriesGroups).length * minAccordionHeight
      : minTotalAccordionHeight;
    const accordionHeight = openedAccordions.value.length > 0
      ? maxTotalAccordionHeight / openedAccordions.value.length
      : 1;

    return (
      Math.min(accordionHeight, maxAccordionHeight) - 2 * accordionBodyYPadding
    );
  });

  return {
    openedAccordions,
    chartHeightPx,
    minChartHeightPx,
  };
};
