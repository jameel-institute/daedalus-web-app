import Highcharts from "highcharts/esm/highcharts";

const mockReset = vi.fn();
const mockOnMouseOver = vi.fn();
const mockOnMouseOverNotToBeCalled = vi.fn();
const hoveredXValue = 1;

vi.mock("highcharts/esm/highcharts", async () => {
  const synchableSeries = {
    options: {
      custom: {
        scenarioId: "successfulResponseRunId",
      },
    },
    getValidPoints: () => [{
      x: hoveredXValue,
      y: 2,
      onMouseOver: vi.fn(() => mockOnMouseOver()),
    }, {
      x: 999,
      y: 20,
      onMouseOver: vi.fn(() => mockOnMouseOverNotToBeCalled()),
    }],
  };
  const unsynchableSeries = {
    options: {
      custom: {
        scenarioId: "shouldNotMatchId",
      },
    },
    getValidPoints: () => [{
      x: hoveredXValue,
      y: 123,
      onMouseOver: vi.fn(() => mockOnMouseOverNotToBeCalled()),
    }],
  };

  return {
    default: {
      chart: () => ({
        series: [unsynchableSeries, synchableSeries],
        pointer: {
          reset: vi.fn(() => mockReset()),
        },
        hoverPoint: { x: hoveredXValue, y: 10, series: synchableSeries },
      }),
    },
  };
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("test the integration of the composables useSynchroniseCharts and useSynchronisableChart", () => {
  it("should synchronize tooltips and crosshairs between charts", async () => {
    const {
      hoverPoint,
      hideTooltips,
      updateHoverPoint,
      hideAllTooltipsAndCrosshairs,
    } = useSynchroniseCharts();

    let expectedCallsToPointerReset = 0;
    let expectedCallsToOnMouseOver = 0;
    const chart = ref<Highcharts.Chart | undefined>();
    const mockEmitHoverPoint = vi.fn();
    const emitHoverPoint = vi.fn((args: Highcharts.Point) => mockEmitHoverPoint(args));

    const { onMove } = useSynchronisableChart(
      chart,
      hideTooltips,
      hoverPoint,
      emitHoverPoint,
    );

    chart.value = Highcharts.chart("", {});
    await nextTick();

    expect(hoverPoint.value).toBeUndefined();
    expect(hideTooltips.value).toBe(false);

    hideTooltips.value = true;
    await nextTick();

    expectedCallsToPointerReset++;
    expect(mockReset).toHaveBeenCalledTimes(expectedCallsToPointerReset);

    updateHoverPoint(chart.value?.hoverPoint as Highcharts.Point);
    await nextTick();
    expectedCallsToOnMouseOver++;

    expect(hideTooltips.value).toBe(false);
    expect(mockReset).toHaveBeenCalledTimes(expectedCallsToPointerReset); // no more calls to reset
    expect(hoverPoint.value).toEqual(chart.value?.hoverPoint);
    expect(mockOnMouseOver).toHaveBeenCalledTimes(expectedCallsToOnMouseOver);
    expect(mockOnMouseOverNotToBeCalled).not.toHaveBeenCalled();

    hideAllTooltipsAndCrosshairs();
    vi.advanceTimersByTime(500);
    await nextTick();
    expectedCallsToPointerReset++;

    expect(hoverPoint.value).toBeUndefined();
    expect(mockOnMouseOver).toHaveBeenCalledTimes(expectedCallsToOnMouseOver); // no more calls to onMouseOver
    expect(hideTooltips.value).toBe(true);
    expect(mockReset).toHaveBeenCalledTimes(expectedCallsToPointerReset);

    onMove();
    vi.advanceTimersByTime(150);
    await nextTick();

    expect(mockEmitHoverPoint).toHaveBeenCalledTimes(1);
    expect(mockEmitHoverPoint).toHaveBeenCalledWith(chart.value?.hoverPoint);
  });
});
