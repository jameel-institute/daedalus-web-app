import { defineStore } from "pinia";
import type { Scenario, ScenariosState } from "@/types/storeTypes";

export const useScenarioStore = defineStore("scenario", {
  state: (): ScenariosState => ({
    scenarios: {},
  }),
  getters: {
    getScenarioById: (state: ScenariosState) => { // https://pinia.vuejs.org/core-concepts/getters.html#Passing-arguments-to-getters
      return (runId: string) => state.scenarios[runId];
    },
    allScenarios: (state: ScenariosState) => { // Untested
      return Object.values(state.scenarios);
    },
  },
  actions: {
    setScenario(runId: string, scenario: Scenario) {
      const state = this as ScenariosState;
      state.scenarios[runId] = scenario;
    },
  },
});
