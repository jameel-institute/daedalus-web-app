import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";
import type { VersionData } from "@/types/apiResponseTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
    versions: undefined,
  }),
  actions: {
    initializeAppState(): void {
      this.largeScreen = true;

      // Avoid using 'await', which would block the rest of the code including the component setup function,
      // in case this mission-non-critical fetch takes a long time.
      useFetch("/api/versions", {
        onResponse: ({ response }) => {
          const data = response._data;
          if (data.daedalusModel) {
            this.versions = data as VersionData;
          }
        },
        lazy: true, // Allows the user to navigate to the current page while this fetch is still pending.
      }) as { data: Ref<VersionData> };
    },
  },
});
