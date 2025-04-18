export interface ScenarioCost {
  id: string
  value: number
  children?: Array<ScenarioCost>
}

export interface ScenarioCapacity {
  id: string
  value: number
}

export interface ScenarioIntervention {
  id: string
  start: number
  end: number
}
