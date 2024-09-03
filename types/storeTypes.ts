export interface Scenario {
  parameters: Record<string, string | number>
};

// A dict of runIds to scenario details.
export interface ScenariosState {
  scenarios: Record<string, Scenario>
}
