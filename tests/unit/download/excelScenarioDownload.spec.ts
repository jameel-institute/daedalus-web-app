import { beforeEach, describe, expect, it } from "vitest";
import { ExcelScenarioDownload } from "~/download/excelScenarioDownload";

import {
  mockAoaToSheet,
  mockBookAppendSheet,
  mockBookNew,
  mockImplementations,
  mockJsonToSheet,
  mockWorkbook,
  mockWriteFile,
} from "./mocks";

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

  const expectMockAppendSheet = (callIndex: number, data: any, sheetName: string) => {
    expect(mockBookAppendSheet.mock.calls[callIndex][0]).toBe(mockWorkbook);
    expect(mockBookAppendSheet.mock.calls[callIndex][1]).toStrictEqual(data);
    expect(mockBookAppendSheet.mock.calls[callIndex][2]).toBe(sheetName);
  };

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
    const expectedFlatCosts = [
      { id: "total", value: 1000000 },
      { id: "gdp", value: 400000 },
      { id: "gdp_closures", value: 100000 },
      { id: "gdp_absences", value: 300000 },
      { id: "life_years", value: 600000 },
      { id: "life_years_children", value: 200000 },
      { id: "life_years_adults", value: 400000 },
    ];
    expect(mockJsonToSheet.mock.calls[1]).toStrictEqual([expectedFlatCosts]);
    expectMockAppendSheet(1, { data: expectedFlatCosts, type: "json" }, "Costs");

    // capacities
    expect(mockJsonToSheet.mock.calls[2]).toStrictEqual([scenario.result.data.capacities]);
    expectMockAppendSheet(2, { data: scenario.result.data.capacities, type: "json" }, "Capacities");

    // interventions
    const expectedInterventions = scenario.result.data.interventions;
    expect(mockJsonToSheet.mock.calls[3]).toStrictEqual([expectedInterventions]);
    expectMockAppendSheet(3, { data: expectedInterventions, type: "json" }, "Interventions");

    // time series
    const expectedTimeSeries = [
      ["prevalence", "deaths"],
      [10, 0],
      [20, 1],
      [30, 2],
    ];
    expect(mockAoaToSheet.mock.calls[0]).toStrictEqual([expectedTimeSeries]);
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

    expect(mockJsonToSheet).toHaveBeenCalledTimes(3);
    expect(mockAoaToSheet).toHaveBeenCalledTimes(2);
    const expectedEmptyInterventionData = [["id", "level", "start", "end"]];
    expect(mockAoaToSheet.mock.calls[0][0]).toStrictEqual(expectedEmptyInterventionData);
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
