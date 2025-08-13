// When charts are vertically adjacent, we need each chart to have a higher z-index than the next one,
// so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus

export default (chartIndex: MaybeRefOrGetter<number>) => {
  const appStore = useAppStore();

  return {
    zIndex: computed(() => {
      const timeSeriesMetadata = appStore.metadata?.results.time_series;
      if (!timeSeriesMetadata) {
        return 0; // Default z-index if metadata is not available
      }
      return (Object.keys(timeSeriesMetadata).length - toValue(chartIndex)) + 3;
    }),
  };
};
