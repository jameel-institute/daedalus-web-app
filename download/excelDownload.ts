import * as XLSX from "xlsx";
import type { ScenarioCost } from "~/types/resultTypes";

export interface FlatCost {
  id: string
  metric: string
  value: number
}

export const HEADERS = {
  DAY: "day",
  CAPACITY_ID: "capacityId",
  COST_ID: "costId",
  END: "end",
  INTERVENTION_ID: "interventionId",
  METRIC: "metric",
  RUN_ID: "runId",
  START: "start",
  UNIT: "unit",
  VALUE: "value",
  VSL_ID: "vslId",
};

export const SHEETS = {
  CAPACITIES: "Capacities",
  COSTS: "Costs",
  INTERVENTIONS: "Interventions",
  TIME_SERIES: "Time series",
  VSL: "Value of Statistical Life",
};

export abstract class ExcelDownload {
  private readonly _workbook: XLSX.WorkBook;

  constructor() {
    this._workbook = XLSX.utils.book_new();
  }

  protected static _flattenCosts(costs: Array<ScenarioCost>, flattened: Array<FlatCost>) {
    // As well as flattening the costs, we rename "id" to "costId"
    costs.forEach((cost: ScenarioCost) => {
      cost.values.forEach((val) => {
        flattened.push({
          id: cost.id,
          metric: val.metric,
          value: val.value,
        });
      });
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
