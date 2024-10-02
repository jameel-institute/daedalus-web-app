import * as XLSX from "xlsx";
import type { Scenario } from "~/types/storeTypes";
import type { ScenarioCost } from "~/types/resultTypes";

interface FlatCost {
  id: string
  value: number
}

export class ExcelScenarioDownload {
  private readonly _scenario: Scenario;
  private readonly _workbook: XLSX.WorkBook;

  constructor(scenario: Scenario) {
    this._scenario = scenario;
    this._workbook = XLSX.utils.book_new();
  }

  private _addDataAsSheet(data: any, sheetName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(this._workbook, worksheet, sheetName);
  }

  private _addParameters() {
    const params = this._scenario.parameters!;
    const paramData = Object.keys(params).map((key: string) => ({
      id: key,
      value: params[key],
    }));
    this._addDataAsSheet(paramData, "Parameters");
  }

  private static _flattenCosts(costs: Array<ScenarioCost>, flattened: Array<FlatCost>) {
    costs.forEach((cost: ScenarioCost) => {
      flattened.push({ id: cost.id, value: cost.value });
      if (cost.children) {
        this._flattenCosts(cost.children, flattened);
      }
    });
  }

  private _addCosts() {
    const costs = this._scenario.result.data!.costs;
    const flattenedCosts: Array<FlatCost> = [];
    ExcelScenarioDownload._flattenCosts(costs, flattenedCosts);
    this._addDataAsSheet(flattenedCosts, "Costs");
  }

  private _addInterventions() {
    this._addDataAsSheet(this._scenario.result.data!.interventions, "Interventions");
  }

  private _addTimeSeries() {
    // Reshape wide time series data to long, and add rows to sheet
    const timeSeries = this._scenario.result.data!.time_series;
    const headers = Object.keys(timeSeries);
    // We rely on there being the same number of time points for each time series!
    const timePoints = timeSeries[headers[0]].length;
    const sheetData = [];
    sheetData.push(headers);
    for (let timePoint = 0; timePoint < timePoints; timePoint++) {
      const row = headers.map((header: string) => timeSeries[header][timePoint]);
      sheetData.push(row);
    }
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(this._workbook, worksheet, "Time series");
  }

  private _buildWorkbook() {
    this._addParameters();
    this._addCosts();
    this._addInterventions();
    this._addTimeSeries();
  }

  public download() {
    if (!this._scenario.parameters && !this._scenario.result.data) {
      throw new Error("Cannot download scenario with no data.");
    }
    this._buildWorkbook();
    const paramValues = Object.values(this._scenario.parameters!).join("_");
    XLSX.writeFile(this._workbook, `daedalus_${paramValues}.xlsx`);
  }
}
