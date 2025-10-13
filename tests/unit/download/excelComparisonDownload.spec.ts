import { beforeEach, describe, expect, it } from "vitest";
import {
  expectMockAppendSheet,
  mockAoaToSheet,
  mockBookNew,
  mockImplementations,
  mockWorkbook,
  mockWriteFile,
} from "./mocks";
import { ExcelComparisonDownload } from "~/download/excelComparisonDownload";

const scenario1 = {
  runId: "abcd",
  parameters: {
    param1: "value1",
    param2: "value2",
  },
  result: {
    data: {
      costs: [{
        id: "total",
        value: 1000000,
        children: [
          {
            id: "gdp",
            value: 400000,
            children: [
              { id: "gdp_closures", value: 100000, children: null },
              { id: "gdp_absences", value: 300000, children: null },
            ],
          },
          {
            id: "life_years",
            value: 600000,
            children: [
              { id: "life_years_children", value: 200000, children: null },
              { id: "life_years_adults", value: 400000, children: null },
            ],
          },
        ],
      }],
      capacities: [
        { id: "hospital_capacity", value: 10000 },
        { id: "ic_capacity", value: 100 },
      ],
      interventions: [],
      time_series: {
        prevalence: [10, 20, 30],
        deaths: [0, 1, 2],
      },
    },
  },
} as any;

const scenario2 = {
  runId: "fghi",
  parameters: {
    param1: "value10",
    param2: "value20",
  },
  result: {
    data: {
      costs: [{
        id: "total",
        value: 1000001,
        children: [
          {
            id: "gdp",
            value: 400001,
            children: [
              { id: "gdp_closures", value: 100001, children: null },
              { id: "gdp_absences", value: 300001, children: null },
            ],
          },
          {
            id: "life_years",
            value: 600001,
            children: [
              { id: "life_years_children", value: 200001, children: null },
              { id: "life_years_adults", value: 400001, children: null },
            ],
          },
        ],
      }],
      capacities: [
        { id: "hospital_capacity", value: 20000 },
      ],
      interventions: [
        { id: "school_closure", start: 10, end: 100 },
        { id: "business_closure", start: 20, end: 200 },
      ],
      time_series: {
        prevalence: [101, 201, 301],
        deaths: [1, 11, 21],
      },
    },
  },
} as any;

const scenarios = [scenario1, scenario2];

describe("excelComparisonDownload", () => {
  beforeEach(() => {
    mockImplementations();
  });

  it("writes expected data to excel file", () => {
    const sut = new ExcelComparisonDownload(scenarios, "param1");
    sut.download();

    const s1Common = ["abcd", "value1", "value2"];
    const s2Common = ["fghi", "value10", "value20"];
    const costUnit = "millions USD";

    expect(mockBookNew).toHaveBeenCalled();

    const expectedCostsData = [
      ["runId", "param1", "param2", "costId", "unit", "value"],
      [...s1Common, "total", costUnit, 1000000],
      [...s1Common, "gdp", costUnit, 400000],
      [...s1Common, "gdp_closures", costUnit, 100000],
      [...s1Common, "gdp_absences", costUnit, 300000],
      [...s1Common, "life_years", costUnit, 600000],
      [...s1Common, "life_years_children", costUnit, 200000],
      [...s1Common, "life_years_adults", costUnit, 400000],

      [...s2Common, "total", costUnit, 1000001],
      [...s2Common, "gdp", costUnit, 400001],
      [...s2Common, "gdp_closures", costUnit, 100001],
      [...s2Common, "gdp_absences", costUnit, 300001],
      [...s2Common, "life_years", costUnit, 600001],
      [...s2Common, "life_years_children", costUnit, 200001],
      [...s2Common, "life_years_adults", costUnit, 400001],
    ];
    expect(mockAoaToSheet.mock.calls[0]).toStrictEqual([expectedCostsData]);
    expectMockAppendSheet(0, { data: expectedCostsData, type: "aoa" }, "Costs");

    const expectedCapacities = [
      ["runId", "param1", "param2", "capacityId", "value"],
      [...s1Common, "hospital_capacity", 10000],
      [...s1Common, "ic_capacity", 100],
      [...s2Common, "hospital_capacity", 20000],
    ];
    expect(mockAoaToSheet.mock.calls[1]).toStrictEqual([expectedCapacities]);
    expectMockAppendSheet(1, { data: expectedCapacities, type: "aoa" }, "Capacities");

    const expectedInterventions = [
      ["runId", "param1", "param2", "interventionId", "start", "end"],
      [...s2Common, "school_closure", 10, 100],
      [...s2Common, "business_closure", 20, 200],
    ];
    expect(mockAoaToSheet.mock.calls[2]).toStrictEqual([expectedInterventions]);
    expectMockAppendSheet(2, { data: expectedInterventions, type: "aoa" }, "Interventions");

    const expectedTimeSeriesData = [
      ["day", "runId", "param1", "param2", "prevalence", "deaths"],
      [1, ...s1Common, 10, 0],
      [2, ...s1Common, 20, 1],
      [3, ...s1Common, 30, 2],
      [1, ...s2Common, 101, 1],
      [2, ...s2Common, 201, 11],
      [3, ...s2Common, 301, 21],
    ];
    expect(mockAoaToSheet.mock.calls[3]).toStrictEqual([expectedTimeSeriesData]);
    expectMockAppendSheet(3, { data: expectedTimeSeriesData, type: "aoa" }, "Time series");

    const expectedFileName = "daedalus_comparison_param1_value1_value10.xlsx";
    expect(mockWriteFile).toHaveBeenCalledWith(mockWorkbook, expectedFileName);
  });

  it("throws error if any scenario has no parameters", () => {
    const sut = new ExcelComparisonDownload([
      scenario1,
      {
        ...scenario2,
        parameters: null,
      },
    ]);
    expect(() => sut.download()).toThrowError("Cannot download scenarios with no data");
  });

  it("throws error if any scenario has no data", () => {
    const sut = new ExcelComparisonDownload([
      {
        ...scenario1,
        result: { data: null },
      },
      scenario2,
    ]);
    expect(() => sut.download()).toThrowError("Cannot download scenarios with no data");
  });
});
