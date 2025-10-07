import * as XLSX from "xlsx";
import type { ScenarioCost } from "~/types/resultTypes";

export interface FlatCost {
  id: string
  value: number
}

export const HEADER_DAY = "day";

export abstract class ExcelDownload {
  private readonly _workbook: XLSX.WorkBook;

  protected static HEADER_DAY = "day";

  constructor() {
    this._workbook = XLSX.utils.book_new();
  }

  protected static _flattenCosts(costs: Array<ScenarioCost>, flattened: Array<FlatCost>) {
    costs.forEach((cost: ScenarioCost) => {
      flattened.push({ id: cost.id, value: cost.value });
      if (cost.children) {
        this._flattenCosts(cost.children, flattened);
      }
    });
  }

  protected _addJsonAsSheet(data: Array<object>, sheetName: string) {
    // adds a worksheet with array-of-object data
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(this._workbook, worksheet, sheetName);
  }

  protected _addAoaAsSheet(data: Array<any[]>, sheetName: string) {
    // adds a worksheet with array-of-array data
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(this._workbook, worksheet, sheetName);
  }

  protected _downloadWorkbook(filename: string) {
    XLSX.writeFile(this._workbook, filename);
  }

  public abstract download(): void;
}
