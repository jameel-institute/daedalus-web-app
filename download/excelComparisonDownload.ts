import type { Scenario } from "~/types/storeTypes";
import { ExcelDownload } from "~/download/excelDownload";

export class ExcelComparisonDownload extends ExcelDownload {
  private readonly _scenarios: Scenario[];
  private readonly _comparisonParameter: string;
  constructor(scenarios: Scenario[], comparisonParameter: string) {
    super();
    this._scenarios = scenarios;
    this._comparisonParameter = comparisonParameter;
  }

  private _addTimeSeries() {
    const exampleScenario = this._scenarios[0];
    const exampleTimeSeries = exampleScenario.result.data!.time_series;
    const parameterIds = Object.keys(exampleScenario.parameters!);
    const outcomes = Object.keys(exampleTimeSeries);
    const numberOfTimePoints = exampleTimeSeries[outcomes[0]].length;
    const rowData = [];
    rowData.push(["day", "runId", ...parameterIds, ...outcomes]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = parameterIds.map(pid => scenario.parameters[pid]);
      const timeSeries = scenario.result.data!.time_series;

      for (let timePoint = 0; timePoint < numberOfTimePoints; timePoint++) {
        const day = timePoint + 1;
        rowData.push([
          day,
          runId,
          ...parameterValues,
          ...outcomes.map(outcome => timeSeries[outcome][timePoint]),
        ]);
      }
    });
    this._addAoaAsSheet(rowData, "Time series");
  }

  public download() {
    this._addTimeSeries();
    this._downloadWorkbook(`daedalus_${this._comparisonParameter}_comparison.xlsx`);
  }
}
