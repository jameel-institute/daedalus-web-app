describe("useComparisonValidation composable", () => {
  it("should return correct 'invalid' & 'feedback'", () => {
    const scenariosToCompareAgainstBaseline = ref<Array<string>>([]);
    const { invalid, feedback } = useComparisonValidation(scenariosToCompareAgainstBaseline);
    expect(invalid.value).toBe(true);
    expect(feedback.value).toBe("Please select at least 1 scenario to compare against the baseline.");
    scenariosToCompareAgainstBaseline.value = ["a"];
    expect(invalid.value).toBe(false);
    expect(feedback.value).toBe(undefined);
    scenariosToCompareAgainstBaseline.value.push("b", "c", "d", "e", "f");
    expect(invalid.value).toBe(true);
    expect(feedback.value).toBe("You can compare up to 5 scenarios against the baseline.");
  });
});
