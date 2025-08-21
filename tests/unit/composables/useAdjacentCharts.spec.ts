describe("useAdjacentCharts composable", () => {
  it("should return the zIndexes for vertically adjacent charts", () => {
    const chartIndex = ref(1);
    const totalNumberOfCharts = ref(5);

    const { zIndex } = useAdjacentCharts(chartIndex, totalNumberOfCharts);

    expect(zIndex.value).toBe(7); // 5 - 1 + 3 = 7

    chartIndex.value = 2;
    expect(zIndex.value).toBe(6); // 5 - 2 + 3 = 6

    totalNumberOfCharts.value = 6;
    expect(zIndex.value).toBe(7); // 6 - 2 + 3 = 7
  });
});
