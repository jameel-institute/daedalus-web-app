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
        values: [{ metric: "usd_millions", value: 1000000 }],
        children: [
          {
            id: "gdp",
            values: [{ metric: "usd_millions", value: 400000 }],
            children: [
              {
                id: "gdp_closures",
                values: [{ metric: "usd_millions", value: 100000 }],
              },
              {
                id: "gdp_absences",
                values: [{ metric: "usd_millions", value: 300000 }],
              },
            ],
          },
          {
            id: "life_years",
            values: [
              { metric: "usd_millions", value: 600000 },
              { metric: "life_years", value: 60000 },
            ],
            children: [
              {
                id: "life_years_children",
                values: [
                  { metric: "usd_millions", value: 200000 },
                  { metric: "life_years", value: 20000 },
                ],
              },
              {
                id: "life_years_adults",
                values: [
                  { metric: "usd_millions", value: 400000 },
                  { metric: "life_years", value: 40000 },
                ],
              },
            ],
          },
        ],
      }],
      capacities: [
        { id: "hospital_capacity", value: 10000 },
        { id: "ic_capacity", value: 100 },
      ],
      interventions: [
        { id: "school_closure", start: 1, end: 101 },
        { id: "business_closure", start: 2, end: 201 },
      ],
      time_series: {
        prevalence: [10, 20, 30],
        deaths: [0, 1, 2],
      },
      vsl: {
        average: 5000000,
        pre_school: 1000000,
        school_age: 2000000,
        working_age: 3000000,
        retirement_age: 4000000,
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
        values: [{ metric: "usd_millions", value: 1000001 }],
        children: [
          {
            id: "gdp",
            values: [{ metric: "usd_millions", value: 400001 }],
            children: [
              {
                id: "gdp_closures",
                values: [{ metric: "usd_millions", value: 100001 }],
              },
              {
                id: "gdp_absences",
                values: [{ metric: "usd_millions", value: 300001 }],
              },
            ],
          },
          {
            id: "life_years",
            values: [
              { metric: "usd_millions", value: 600001 },
              { metric: "life_years", value: 60001 },
            ],
            children: [
              {
                id: "life_years_children",
                values: [
                  { metric: "usd_millions", value: 200001 },
                  { metric: "life_years", value: 20001 },
                ],
              },
              {
                id: "life_years_adults",
                values: [
                  { metric: "usd_millions", value: 400001 },
                  { metric: "life_years", value: 40001 },
                ],
              },
            ],
          },
        ],
      }],
      capacities: [
        { id: "hospital_capacity", value: 20000 },
      ],
      interventions: [
        { id: "response", start: 10, end: 100 },
        { id: "response", start: 20, end: 200 },
      ],
      time_series: {
        prevalence: [101, 201, 301],
        deaths: [1, 11, 21],
      },
      vsl: {
        average: 5000000.1,
        pre_school: 1000000.2,
        school_age: 2000000.3,
        working_age: 3000000.4,
        retirement_age: 4000000.5,
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
    const usdMetric = "usd_millions";
    const lifeYearsMetric = "life_years";

    expect(mockBookNew).toHaveBeenCalled();

    const expectedCostsData = [
      ["runId", "param1", "param2", "costId", "metric", "value"],
      [...s1Common, "total", usdMetric, 1000000],
      [...s1Common, "gdp", usdMetric, 400000],
      [...s1Common, "gdp_closures", usdMetric, 100000],
      [...s1Common, "gdp_absences", usdMetric, 300000],
      [...s1Common, "life_years", usdMetric, 600000],
      [...s1Common, "life_years", lifeYearsMetric, 60000],
      [...s1Common, "life_years_children", usdMetric, 200000],
      [...s1Common, "life_years_children", lifeYearsMetric, 20000],
      [...s1Common, "life_years_adults", usdMetric, 400000],
      [...s1Common, "life_years_adults", lifeYearsMetric, 40000],

      [...s2Common, "total", usdMetric, 1000001],
      [...s2Common, "gdp", usdMetric, 400001],
      [...s2Common, "gdp_closures", usdMetric, 100001],
      [...s2Common, "gdp_absences", usdMetric, 300001],
      [...s2Common, "life_years", usdMetric, 600001],
      [...s2Common, "life_years", lifeYearsMetric, 60001],
      [...s2Common, "life_years_children", usdMetric, 200001],
      [...s2Common, "life_years_children", lifeYearsMetric, 20001],
      [...s2Common, "life_years_adults", usdMetric, 400001],
      [...s2Common, "life_years_adults", lifeYearsMetric, 40001],
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
      [...s1Common, "school_closure", 1, 101],
      [...s1Common, "business_closure", 2, 201],
      [...s2Common, "response", 10, 100],
      [...s2Common, "response", 20, 200],
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

    const expectedVSLData = [
      ["runId", "param1", "param2", "vslId", "value"],
      [...s1Common, "average", 5000000],
      [...s1Common, "pre_school", 1000000],
      [...s1Common, "school_age", 2000000],
      [...s1Common, "working_age", 3000000],
      [...s1Common, "retirement_age", 4000000],
      [...s2Common, "average", 5000000.1],
      [...s2Common, "pre_school", 1000000.2],
      [...s2Common, "school_age", 2000000.3],
      [...s2Common, "working_age", 3000000.4],
      [...s2Common, "retirement_age", 4000000.5],
    ];
    expect(mockAoaToSheet.mock.calls[4]).toStrictEqual([expectedVSLData]);
    expectMockAppendSheet(4, { data: expectedVSLData, type: "aoa" }, "Value of Statistical Life");

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
