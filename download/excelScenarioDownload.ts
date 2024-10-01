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
  // TODO: we'll probably want to add store as well so we can commit state change to downloading/add error

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

  private _buildWorkbook() {
    this._addParameters();
    this._addCosts();
    this._addInterventions();
    // TODO: add time_series
  }

  public download() {
    try {
      if (!this._scenario.parameters && !this._scenario.result.data) {
        throw new Error("Cannot download scenario with no data.");
      }
      this._buildWorkbook();
      const paramValues = Object.values(this._scenario.parameters).join("_");
      XLSX.writeFile(this._workbook, `daedalus_${paramValues}.xlsx`);
    } catch (e) {
      // TODO: Set error in store, and display
    }
  }
}
