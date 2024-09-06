import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";
import type { VersionData } from "@/types/apiResponseTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
    versions: undefined,
  }),
  actions: {
    async initializeAppState() {
      const { data: versionData } = await useFetch("/api/versions", { timeout: 100 }) as { data: Ref<VersionData> };
      this.versions = versionData.value;
    },
  },
});
