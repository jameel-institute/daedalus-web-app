import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
  }),
  getters: {
    screenIsLarge: (state: AppState): boolean => {
      return state.largeScreen;
    },
  },
  actions: {
    initializeAppState(): void {
      this.largeScreen = true;
    },
    setScreenSize(large: boolean): void {
      this.largeScreen = large;
    },
  },
});
