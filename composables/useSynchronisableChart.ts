// This composable should be used alongside useChartSynchroniser.
// This composable is to be used by the child component whose siblings are synchronised by a parent.
import throttle from "lodash.throttle";

export default (
  chartRef: MaybeRefOrGetter<Highcharts.Chart | undefined>,
  hideTooltips: MaybeRefOrGetter<boolean>,
  synchPoint: MaybeRefOrGetter<Highcharts.Point | undefined>,
  emitHoverPoint: (point: Highcharts.Point) => void,
) => {
  const chart = computed(() => toValue(chartRef));

  /**
   * Synchronize tooltips and crosshairs between charts.
   * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
   */
  watch(() => toValue(synchPoint), (newSynchPoint) => {
    if (newSynchPoint && chart.value?.series) {
      // Get the series in this chart that matches the series being hovered in some chart
      const series = chart.value.series.find((series) => {
        return series.options.custom?.scenarioId === newSynchPoint.series.options.custom?.scenarioId;
      });

      // Get the point in the matching series that has the same 'x' value as some chart's hovered point
      const point = series?.getValidPoints().find(({ x }) => x === newSynchPoint.x);

      if (point && point !== newSynchPoint) {
        point.onMouseOver();
      }
    }
  });

  watch(() => toValue(hideTooltips), (shouldHide) => {
    if (shouldHide) {
      toValue(chartRef)?.pointer.reset(false, 0); // Hide all tooltips and crosshairs
    }
  });

  const onMove = throttle(() => {
    if (chart.value?.hoverPoint) {
      emitHoverPoint(chart.value.hoverPoint);
    };
  }, 150, { leading: true });

  return { onMove };
};
