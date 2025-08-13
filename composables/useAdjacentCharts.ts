// When charts are vertically adjacent, we need each chart to have a higher z-index than the next one,
// so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus

export default (
  chartIndex: MaybeRefOrGetter<number>,
  totalNumberOfCharts: MaybeRefOrGetter<number>,
) => {
  return {
    zIndex: computed(() => (toValue(totalNumberOfCharts) - toValue(chartIndex)) + 3),
  };
};
