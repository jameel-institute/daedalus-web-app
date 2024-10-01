import * as XLSX from "xlsx";
import type { Scenario } from "~/types/storeTypes";

export class ExcelScenarioDownload {
  private readonly _scenario: Scenario;
  private readonly _workbook: XLSX.WorkBook;
  // TODO: we'll probably want to add store as well so we can commit state change to downloading/add error

  constructor(scenario: Scenario) {
    this._scenario = scenario;
    this._workbook = XLSX.utils.book_new();
  }

  private _addParameters() {
    const params = this._scenario.parameters;
    if (params) {
      const paramData = Object.keys(params).map((key: string) => ({
        id: key,
        value: params[key],
      }));
      const worksheet = XLSX.utils.json_to_sheet(paramData);
      XLSX.utils.book_append_sheet(this._workbook, worksheet, "Parameters");
    }
  }

  private _buildWorkbook() {
    this._addParameters();
  }

  public download() {
    try {
      this._buildWorkbook();
      // TODO: generate a sensible filename from param values
      XLSX.writeFile(this._workbook, "test_daedalus.xlsx");
    } catch (e) {
      // TODO: Set error in store, and display
    }
  }
}
