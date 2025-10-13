import type { Scenario } from "~/types/storeTypes";
import {
  ExcelDownload,
  type FlatCost,
  HEADERS,
  SHEETS,
  UNIT_USD_MILLIONS,
} from "~/download/excelDownload";

export class ExcelScenarioDownload extends ExcelDownload {
  private readonly _scenario: Scenario;

  constructor(scenario: Scenario) {
    super();
    this._scenario = scenario;
  }

  private _addParameters() {
    const params = this._scenario.parameters!;
    const paramData = Object.keys(params).map((key: string) => ({
      id: key,
      value: params[key],
    }));
    this._addJsonAsSheet(paramData, "Parameters");
  }

  private _addCosts() {
    const costs = this._scenario.result.data!.costs;
    const flattenedCosts: Array<FlatCost> = [];
    ExcelDownload._flattenCosts(costs, flattenedCosts);
    const sheetData = [];
    // headers
    sheetData.push([HEADERS.COST_ID, HEADERS.UNIT, HEADERS.VALUE]);
    flattenedCosts.forEach((cost) => {
      sheetData.push([cost.id, UNIT_USD_MILLIONS, cost.value]);
    });
    this._addAoaAsSheet(sheetData, SHEETS.COSTS);
  }

  private _addCapacities() {
    const sheetData = [];
    sheetData.push([HEADERS.CAPACITY_ID, HEADERS.VALUE]);
    this._scenario.result.data!.capacities.forEach((capacity) => {
      sheetData.push([capacity.id, capacity.value]);
    });
    this._addAoaAsSheet(sheetData, SHEETS.CAPACITIES);
  }

  private _addInterventions() {
    const sheetData = [];
    sheetData.push([HEADERS.INTERVENTION_ID, HEADERS.START, HEADERS.END]);
    this._scenario.result.data!.interventions.forEach((intervention) => {
      sheetData.push([intervention.id, intervention.start, intervention.end]);
    });
    this._addAoaAsSheet(sheetData, SHEETS.INTERVENTIONS);
  }

  private _addTimeSeries() {
    // Reshape wide time series data to long, and add rows to sheet
    const timeSeries = this._scenario.result.data!.time_series;
    const timeSeriesIds = Object.keys(timeSeries);
    // We rely on there being the same number of time points for each time series!
    const numberOfTimePoints = timeSeries[timeSeriesIds[0]].length;
    const sheetData = [];
    sheetData.push([HEADERS.DAY, ...timeSeriesIds]);
    for (let timePoint = 0; timePoint < numberOfTimePoints; timePoint++) {
      const day = timePoint + 1;
      const values = timeSeriesIds.map((id: string) => timeSeries[id][timePoint]);
      sheetData.push([day, ...values]);
    }
    this._addAoaAsSheet(sheetData, SHEETS.TIME_SERIES);
  }

  private _buildWorkbook() {
    this._addParameters();
    this._addCosts();
    this._addCapacities();
    this._addInterventions();
    this._addTimeSeries();
  }

  public download() {
    if (!this._scenario.parameters || !this._scenario.result.data) {
      throw new Error("Cannot download scenario with no data.");
    }
    this._buildWorkbook();
    const paramValues = Object.values(this._scenario.parameters!).join("_");
    this._downloadWorkbook(`daedalus_${paramValues}.xlsx`);
  }
}
