export interface ScenarioCost {
  id: string
  value: number
  children?: Array<ScenarioCost>
}

export interface ScenarioCapacity {
  id: string
  value: number
}

export enum InterventionLevel {
  Light = "light",
  Heavy = "heavy",
}

export interface ScenarioIntervention {
  id: string
  level: InterventionLevel
  start: number
  end: number
}
