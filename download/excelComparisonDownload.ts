import type { Scenario } from "~/types/storeTypes";
import {
  ExcelDownload,
  type FlatCost,
  HEADER_CAPACITY_ID,
  HEADER_COST_ID,
  HEADER_DAY,
  HEADER_END,
  HEADER_INTERVENTION_ID,
  HEADER_RUN_ID,
  HEADER_START,
  HEADER_UNIT,
  HEADER_VALUE,
  SHEET_CAPACITIES,
  SHEET_COSTS,
  SHEET_INTERVENTIONS,
  SHEET_TIME_SERIES,
  UNIT_USD_MILLIONS,
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
    rowData.push([HEADER_RUN_ID, ...this._parameterIds, HEADER_COST_ID, HEADER_UNIT, HEADER_VALUE]);

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
        const costValue = flatCosts.find(cost => cost.id === costId)!.value;
        rowData.push([runId, ...parameterValues, costId, UNIT_USD_MILLIONS, costValue]);
      });
    });
    this._addAoaAsSheet(rowData, SHEET_COSTS);
  }

  private _addCapacities() {
    const sheetData = [];
    sheetData.push([HEADER_RUN_ID, ...this._parameterIds, HEADER_CAPACITY_ID, HEADER_VALUE]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._getParameterValues(scenario);
      scenario.result.data!.capacities.forEach((capacity) => {
        sheetData.push([runId, ...parameterValues, capacity.id, capacity.value]);
      });
    });
    this._addAoaAsSheet(sheetData, SHEET_CAPACITIES);
  }

  private _addInterventions() {
    const sheetData = [];
    sheetData.push([HEADER_RUN_ID, ...this._parameterIds, HEADER_INTERVENTION_ID, HEADER_START, HEADER_END]);
    this._scenarios.forEach((scenario) => {
      const { runId } = scenario;
      const parameterValues = this._getParameterValues(scenario);
      scenario.result.data!.interventions.forEach((intervention) => {
        sheetData.push([runId, ...parameterValues, intervention.id, intervention.start, intervention.end]);
      });
    });
    this._addAoaAsSheet(sheetData, SHEET_INTERVENTIONS);
  }

  private _addTimeSeries() {
    const exampleTimeSeries = this._exampleScenario.result.data!.time_series;
    const outcomes = Object.keys(exampleTimeSeries);
    const numberOfTimePoints = exampleTimeSeries[outcomes[0]].length;
    const rowData = [];
    // headers
    rowData.push([HEADER_DAY, HEADER_RUN_ID, ...this._parameterIds, ...outcomes]);
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
    this._addAoaAsSheet(rowData, SHEET_TIME_SERIES);
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
