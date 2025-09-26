import type { Scenario } from "~/types/storeTypes";
import { ExcelDownload } from "~/download/excelDownload";
import type { ScenarioCost } from "~/types/resultTypes";

export class ExcelComparisonDownload extends ExcelDownload {
  private readonly _scenarios: Scenario[];
  private readonly _comparisonParameter: string;

  private readonly _exampleScenario: Scenario;
  private readonly _parameterIds: string[];

  constructor(scenarios: Scenario[], comparisonParameter: string) {
    super();
    this._scenarios = scenarios;
    this._comparisonParameter = comparisonParameter;

    this._exampleScenario = this._scenarios[0];
    this._parameterIds = Object.keys(this._exampleScenario.parameters!);
  }

  private _addCosts() {
    const rowData = [];
    // headers
    rowData.push(["runId", ...this._parameterIds, "costId", "unit", "value"]);

    // get all cost ids
    const exampleFlatCosts: ScenarioCost[] = [];
    ExcelDownload._flattenCosts(this._exampleScenario.result.data!.costs, exampleFlatCosts);
    const costIds = exampleFlatCosts.map(cost => cost.id);

    const costUnit = "millions USD"; // We will add natural units in a later ticket

    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._parameterIds.map(pid => scenario.parameters[pid]);
      const flatCosts: ScenarioCost[] = [];
      ExcelDownload._flattenCosts(scenario.result.data!.costs, flatCosts);
      costIds.forEach((costId) => {
        const costValue = flatCosts.find(cost => cost.id === costId)!.value;
        rowData.push([runId, ...parameterValues, costId, costUnit, costValue]);
      });
    });
    this._addAoaAsSheet(rowData, "Costs");
  }

  private _addTimeSeries() {
    const exampleTimeSeries = this._exampleScenario.result.data!.time_series;
    const outcomes = Object.keys(exampleTimeSeries);
    const numberOfTimePoints = exampleTimeSeries[outcomes[0]].length;
    const rowData = [];
    // headers
    rowData.push(["day", "runId", ...this._parameterIds, ...outcomes]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._parameterIds.map(pid => scenario.parameters[pid]);
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
    this._addCosts();
    this._addTimeSeries();
    this._downloadWorkbook(`daedalus_${this._comparisonParameter}_comparison.xlsx`);
  }
}
