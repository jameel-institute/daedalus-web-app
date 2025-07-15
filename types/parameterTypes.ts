import type { DisplayInfo } from "~/types/apiResponseTypes";

export type ParameterValue = string | number;
export interface ParameterSet { [key: string]: ParameterValue };

// For metadata
// ============
export type ParameterOption = DisplayInfo;

export enum TypeOfParameter {
  Select = "select",
  GlobeSelect = "globeSelect",
  Numeric = "numeric",
}

export interface RangeData {
  min: number
  default: number
  max: number
}

interface UpdateNumericFrom {
  parameterId: string
  values: Record<string, RangeData>
}

export interface Parameter extends DisplayInfo {
  parameterType: TypeOfParameter
  defaultOption?: string
  ordered: boolean
  options?: Array<ParameterOption>
  step?: number
  updateNumericFrom?: UpdateNumericFrom
}
