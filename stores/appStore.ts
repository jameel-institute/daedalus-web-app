import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";
import type { VersionData } from "@/types/apiResponseTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
    versions: undefined,
  }),
  getters: {
    screenIsLarge: (state: AppState): boolean => {
      return state.largeScreen;
    },
    getVersions: (state: AppState): VersionData | undefined => {
      return state.versions;
    },
  },
  actions: {
    async initializeAppState() {
      this.largeScreen = true;
      const { data: versionData } = await useFetch("/api/versions", { timeout: 100 }) as { data: Ref<VersionData> };
      this.versions = versionData.value;
    },
    setScreenSize(bool: boolean): void {
      this.largeScreen = bool;
    },
  },
});
