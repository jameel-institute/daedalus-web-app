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
      interventions: [
        { id: "school_closures", start: 10, end: 100, level: "light" },
        { id: "business_closures", start: 5, end: 50, level: "heavy" },
      ],
      capacities: [
        { id: "hospital_capacities", value: 25000 },
      ],
      time_series: {
        prevalence: [10, 20, 30],
        deaths: [0, 1, 2],
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
      ["costId", "unit", "value"],
      ["total", "millions USD", 1000000],
      ["gdp", "millions USD", 400000],
      ["gdp_closures", "millions USD", 100000],
      ["gdp_absences", "millions USD", 300000],
      ["life_years", "millions USD", 600000],
      ["life_years_children", "millions USD", 200000],
      ["life_years_adults", "millions USD", 400000],
    ];
    expect(mockAoaToSheet.mock.calls[0]).toStrictEqual([expectedCosts]);
    expectMockAppendSheet(1, { data: expectedCosts, type: "aoa" }, "Costs");

    // capacities
    expect(mockJsonToSheet.mock.calls[1]).toStrictEqual([scenario.result.data.capacities]);
    expectMockAppendSheet(2, { data: scenario.result.data.capacities, type: "json" }, "Capacities");

    // interventions
    const expectedInterventions = scenario.result.data.interventions;
    expect(mockJsonToSheet.mock.calls[2]).toStrictEqual([expectedInterventions]);
    expectMockAppendSheet(3, { data: expectedInterventions, type: "json" }, "Interventions");

    // time series
    const expectedTimeSeries = [
      ["day", "prevalence", "deaths"],
      [1, 10, 0],
      [2, 20, 1],
      [3, 30, 2],
    ];
    expect(mockAoaToSheet.mock.calls[1]).toStrictEqual([expectedTimeSeries]);
    expectMockAppendSheet(4, { data: expectedTimeSeries, type: "aoa" }, "Time series");

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

    expect(mockJsonToSheet).toHaveBeenCalledTimes(2);
    expect(mockAoaToSheet).toHaveBeenCalledTimes(3);
    const expectedEmptyInterventionData = [["id", "level", "start", "end"]];
    expect(mockAoaToSheet.mock.calls[1][0]).toStrictEqual(expectedEmptyInterventionData);
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
