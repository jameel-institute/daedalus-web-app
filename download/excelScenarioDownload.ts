import type { ScenarioCost } from "~/types/resultTypes";
import type { Scenario } from "~/types/storeTypes";
import { ExcelDownload } from "~/download/excelDownload";

interface FlatCost {
  id: string
  value: number
}

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
    this._addJsonAsSheet(flattenedCosts, "Costs");
  }

  private _addCapacities() {
    this._addJsonAsSheet(this._scenario.result.data!.capacities, "Capacities");
  }

  private _addInterventions() {
    const sheetName = "Interventions";
    if (this._scenario.result.data!.interventions.length > 0) {
      this._addJsonAsSheet(this._scenario.result.data!.interventions, sheetName);
    } else {
      // There will be no interventions in scenario if response is none - in this case, we output
      // intervention type headers only
      const headers = ["id", "level", "start", "end"];
      this._addAoaAsSheet([headers], sheetName);
    }
  }

  private _addTimeSeries() {
    // Reshape wide time series data to long, and add rows to sheet
    const timeSeries = this._scenario.result.data!.time_series;
    const headers = Object.keys(timeSeries);
    // We rely on there being the same number of time points for each time series!
    const numberOfTimePoints = timeSeries[headers[0]].length;
    const sheetData = [];
    sheetData.push(headers);
    for (let timePoint = 0; timePoint < numberOfTimePoints; timePoint++) {
      const row = headers.map((header: string) => timeSeries[header][timePoint]);
      sheetData.push(row);
    }
    this._addAoaAsSheet(sheetData, "Time series");
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
