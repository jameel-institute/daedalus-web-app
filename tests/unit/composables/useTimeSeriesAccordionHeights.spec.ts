describe("useTimeSeriesAccordionHeights composable", () => {
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
});
