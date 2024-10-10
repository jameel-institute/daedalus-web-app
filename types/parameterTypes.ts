import type { DisplayInfo } from "~/types/apiResponseTypes";

export interface ParameterSet { [key: string]: string };

// For metadata
// ============
export type ParameterOption = DisplayInfo;

export enum TypeOfParameter {
  Select = "select",
  GlobeSelect = "globeSelect",
  Numeric = "numeric",
}

export interface ValueData {
  min: number
  default: number
  max: number
}

interface UpdateNumericFrom {
  parameterId: string
  values: Record<string, ValueData>
}

export interface Parameter {
  id: string
  label: string
  parameterType: TypeOfParameter
  defaultOption: string | null
  ordered: boolean
  options: Array<ParameterOption>
  step: number | null
  updateNumericFrom: UpdateNumericFrom | null
}
