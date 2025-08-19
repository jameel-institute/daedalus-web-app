describe("useTimeSeriesAccordionHeights composable", () => {
  beforeEach(() => {
    // Reset store state between tests
    const appStore = useAppStore();
    appStore.preferences.openedTimeSeriesAccordions = [];
  });

  it("should return correct minChartHeightPx & openedAccordions", () => {
    const { minChartHeightPx, openedAccordions } = useTimeSeriesAccordionHeights();
    expect(minChartHeightPx).toBe(129);
    expect(openedAccordions.value).toEqual([]);
  });

  it.each([
    [0, [], -15],
    [1, ["1"], 384],
    [2, ["1", "2"], 234],
    [3, ["1", "2", "3"], 150],
    [4, ["1", "2", "3", "4"], 109],
  ])(
    "should calculate correct chartHeightPx when num openedAccordions is %d",
    (
      _numOpenAccordians: number,
      openAccordionList: any[],
      expected: number,
    ) => {
      const { chartHeightPx, openedAccordions } = useTimeSeriesAccordionHeights();
      openedAccordions.value = openAccordionList;
      expect(Math.floor(chartHeightPx.value)).toBe(expected);
    },
  );

  it("should persist openedAccordions state in app store preferences", () => {
    const appStore = useAppStore();
    const { openedAccordions } = useTimeSeriesAccordionHeights();

    // Initially should be empty
    expect(openedAccordions.value).toEqual([]);
    expect(appStore.preferences.openedTimeSeriesAccordions).toEqual([]);

    // Setting openedAccordions should update store preferences
    openedAccordions.value = ["infections", "deaths"];
    expect(appStore.preferences.openedTimeSeriesAccordions).toEqual(["infections", "deaths"]);

    // Changes to store preferences should be reflected in openedAccordions
    appStore.preferences.openedTimeSeriesAccordions = ["hospitalizations"];
    expect(openedAccordions.value).toEqual(["hospitalizations"]);
  });

  it("should maintain state across multiple instances of the composable", () => {
    const appStore = useAppStore();

    // Set initial state
    appStore.preferences.openedTimeSeriesAccordions = ["infections", "deaths"];

    // Create first instance
    const instance1 = useTimeSeriesAccordionHeights();
    expect(instance1.openedAccordions.value).toEqual(["infections", "deaths"]);

    // Create second instance
    const instance2 = useTimeSeriesAccordionHeights();
    expect(instance2.openedAccordions.value).toEqual(["infections", "deaths"]);

    // Modifying through one instance should affect the other
    instance1.openedAccordions.value = ["hospitalizations", "icu"];
    expect(instance2.openedAccordions.value).toEqual(["hospitalizations", "icu"]);
    expect(appStore.preferences.openedTimeSeriesAccordions).toEqual(["hospitalizations", "icu"]);
  });
});
