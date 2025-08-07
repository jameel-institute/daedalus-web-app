// This composable should be used alongside useSynchronisableChart.
// This composable is to be used by the parent component which manages multiple
// synchronised charts.
export default () => {
  const hoverPoint = ref<Highcharts.Point | undefined>();
  const hideTooltips = ref(false);

  const updateHoverPoint = (point: Highcharts.Point) => {
    hideTooltips.value = false;
    hoverPoint.value = point;
  };

  const hideAllTooltipsAndCrosshairs = () => {
    setTimeout(() => {
      hideTooltips.value = true;
    }, 500);
  };

  return {
    hoverPoint,
    hideTooltips,
    updateHoverPoint,
    hideAllTooltipsAndCrosshairs,
  };
};
