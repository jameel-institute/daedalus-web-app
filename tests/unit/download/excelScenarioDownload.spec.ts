import { beforeEach, describe, expect, it } from "vitest";
import {
  expectMockAppendSheet,
  mockAoaToSheet,
  mockBookNew,
  mockImplementations,
  mockJsonToSheet,
  mockWorkbook,
  mockWriteFile,
} from "./mocks";
import { ExcelScenarioDownload } from "~/download/excelScenarioDownload";

const scenario = {
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
      interventions: [
        { id: "response", start: 10, end: 100 },
        { id: "response", start: 5, end: 50 },
      ],
      capacities: [
        { id: "hospital_capacities", value: 25000 },
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

describe("excelScenarioDownload", () => {
  beforeEach(() => {
    mockImplementations();
  });

  it("writes expected data to excel file", () => {
    const sut = new ExcelScenarioDownload(scenario);
    sut.download();

    expect(mockBookNew).toHaveBeenCalled();

    // parameters
    const expectedParams = [
      { id: "param1", value: "value1" },
      { id: "param2", value: "value2" },
    ];
    expect(mockJsonToSheet.mock.calls[0]).toStrictEqual([expectedParams]);
    expectMockAppendSheet(0, { data: expectedParams, type: "json" }, "Parameters");

    // costs
    const expectedCosts = [
      ["costId", "metric", "value"],
      ["total", "usd_millions", 1000000],
      ["gdp", "usd_millions", 400000],
      ["gdp_closures", "usd_millions", 100000],
      ["gdp_absences", "usd_millions", 300000],
      ["life_years", "usd_millions", 600000],
      ["life_years", "life_years", 60000],
      ["life_years_children", "usd_millions", 200000],
      ["life_years_children", "life_years", 20000],
      ["life_years_adults", "usd_millions", 400000],
      ["life_years_adults", "life_years", 40000],
    ];
    expect(mockAoaToSheet.mock.calls[0]).toStrictEqual([expectedCosts]);
    expectMockAppendSheet(1, { data: expectedCosts, type: "aoa" }, "Costs");

    // capacities
    const expectedCapacities = [
      ["capacityId", "value"],
      ["hospital_capacities", 25000],
    ];
    expect(mockAoaToSheet.mock.calls[1]).toStrictEqual([expectedCapacities]);
    expectMockAppendSheet(2, { data: expectedCapacities, type: "aoa" }, "Capacities");

    // interventions
    const expectedInterventions = [
      ["interventionId", "start", "end"],
      ["response", 10, 100],
      ["response", 5, 50],
    ];
    expect(mockAoaToSheet.mock.calls[2]).toStrictEqual([expectedInterventions]);
    expectMockAppendSheet(3, { data: expectedInterventions, type: "aoa" }, "Interventions");

    // time series
    const expectedTimeSeries = [
      ["day", "prevalence", "deaths"],
      [1, 10, 0],
      [2, 20, 1],
      [3, 30, 2],
    ];
    expect(mockAoaToSheet.mock.calls[3]).toStrictEqual([expectedTimeSeries]);
    expectMockAppendSheet(4, { data: expectedTimeSeries, type: "aoa" }, "Time series");

    // VSLs
    const expectedVSLs = [
      ["vslId", "value"],
      ["average", 5000000],
      ["pre_school", 1000000],
      ["school_age", 2000000],
      ["working_age", 3000000],
      ["retirement_age", 4000000],
    ];
    expect(mockAoaToSheet.mock.calls[4]).toStrictEqual([expectedVSLs]);
    expectMockAppendSheet(5, { data: expectedVSLs, type: "aoa" }, "Value of Statistical Life");

    const expectedFileName = "daedalus_value1_value2.xlsx";
    expect(mockWriteFile).toHaveBeenCalledWith(mockWorkbook, expectedFileName);
  });

  it("writes headers when there are no interventions", () => {
    const noInterventions = {
      ...scenario,
      result: {
        ...scenario.result,
        data: {
          ...scenario.result.data,
          interventions: [],
        },
      },
    };
    const sut = new ExcelScenarioDownload(noInterventions);
    sut.download();

    expect(mockJsonToSheet).toHaveBeenCalledTimes(1);
    expect(mockAoaToSheet).toHaveBeenCalledTimes(5);
    const expectedEmptyInterventionData = [["interventionId", "start", "end"]];
    expect(mockAoaToSheet.mock.calls[2][0]).toStrictEqual(expectedEmptyInterventionData);
    expectMockAppendSheet(3, { data: expectedEmptyInterventionData, type: "aoa" }, "Interventions");
  });

  it("throws error if scenario has no parameters", () => {
    const noParams = { ...scenario, parameters: null };
    const sut = new ExcelScenarioDownload(noParams);
    expect(() => sut.download()).toThrowError("Cannot download scenario with no data");
  });

  it("throws error if scenario has no result data", () => {
    const noData = {
      ...scenario,
      result: {
        data: null,
      },
    };
    const sut = new ExcelScenarioDownload(noData);
    expect(() => sut.download()).toThrowError("Cannot download scenario with no data");
  });
});
