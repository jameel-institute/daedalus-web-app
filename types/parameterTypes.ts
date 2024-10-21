export interface ParameterSet { [key: string]: string };

// For metadata
// ============
export interface ParameterOption {
  id: string
  label: string
}

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
  defaultOption: string | undefined
  ordered: boolean
  options: Array<ParameterOption> | undefined
  step: number | undefined
  updateNumericFrom: UpdateNumericFrom | undefined
}
