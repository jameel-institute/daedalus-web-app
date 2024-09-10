export interface ParameterOption {
  id: string
  label: string
}

export enum TypeOfParameter {
  Select = "select",
  GlobeSelect = "globeSelect",
  Numeric = "numeric",
}

interface ValueData {
  min: number
  default: number
  max: number
}

interface UpdateNumericFrom {
  parameterId: string
  values: Array<Record<string, ValueData>>
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
