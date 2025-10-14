import type { Scenario } from "~/types/storeTypes";
import {
  ExcelDownload,
  type FlatCost,
  HEADERS,
  SHEETS,
} from "~/download/excelDownload";

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

  private _getParameterValues(scenario: Scenario) {
    return this._parameterIds.map(pid => scenario.parameters[pid]);
  }

  private _addCosts() {
    const rowData = [];
    // headers
    rowData.push([HEADERS.RUN_ID, ...this._parameterIds, HEADERS.COST_ID, HEADERS.METRIC, HEADERS.VALUE]);

    // get all cost ids
    const exampleFlatCosts: FlatCost[] = [];
    ExcelDownload._flattenCosts(this._exampleScenario.result.data!.costs, exampleFlatCosts);
    const costIds = exampleFlatCosts.map(cost => cost.id);

    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._getParameterValues(scenario);
      const flatCosts: FlatCost[] = [];
      ExcelDownload._flattenCosts(scenario.result.data!.costs, flatCosts);
      costIds.forEach((costId) => {
        const costs = flatCosts.filter(cost => cost.id === costId)!;
        costs.forEach(cost => rowData.push([runId, ...parameterValues, costId, cost.metric, cost.value]));
      });
    });
    this._addAoaAsSheet(rowData, SHEETS.COSTS);
  }

  private _addCapacities() {
    const sheetData = [];
    sheetData.push([HEADERS.RUN_ID, ...this._parameterIds, HEADERS.CAPACITY_ID, HEADERS.VALUE]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._getParameterValues(scenario);
      scenario.result.data!.capacities.forEach((capacity) => {
        sheetData.push([runId, ...parameterValues, capacity.id, capacity.value]);
      });
    });
    this._addAoaAsSheet(sheetData, SHEETS.CAPACITIES);
  }

  private _addInterventions() {
    const sheetData = [];
    sheetData.push([HEADERS.RUN_ID, ...this._parameterIds, HEADERS.INTERVENTION_ID, HEADERS.START, HEADERS.END]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._getParameterValues(scenario);
      scenario.result.data!.interventions.forEach((intervention) => {
        sheetData.push([runId, ...parameterValues, intervention.id, intervention.start, intervention.end]);
      });
    });
    this._addAoaAsSheet(sheetData, SHEETS.INTERVENTIONS);
  }

  private _addTimeSeries() {
    const exampleTimeSeries = this._exampleScenario.result.data!.time_series;
    const outcomes = Object.keys(exampleTimeSeries);
    const numberOfTimePoints = exampleTimeSeries[outcomes[0]].length;
    const rowData = [];
    // headers
    rowData.push([HEADERS.DAY, HEADERS.RUN_ID, ...this._parameterIds, ...outcomes]);
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
    this._addAoaAsSheet(rowData, SHEETS.TIME_SERIES);
  }

  private _getFilename() {
    const comparisonParamValues = this._scenarios.map(scenario => scenario.parameters[this._comparisonParameter]);
    const paramValuesString = comparisonParamValues.join("_");
    return `daedalus_comparison_${this._comparisonParameter}_${paramValuesString}.xlsx`;
  }

  public download() {
    if (this._scenarios.some(s => !s.parameters || !s.result.data)) {
      throw new Error("Cannot download scenarios with no data.");
    }

    this._addCosts();
    this._addCapacities();
    this._addInterventions();
    this._addTimeSeries();
    this._downloadWorkbook(this._getFilename());
  }
}
