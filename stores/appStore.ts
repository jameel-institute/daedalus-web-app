import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";
import type { VersionData } from "@/types/apiResponseTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
    versions: undefined,
  }),
  actions: {
    // This function is designed to be called e.g. in onMounted lifecycle hooks, not
    // setup scripts (hence the use of $fetch rather than useFetch), since version data
    // does not need to be immediately available as soon as the page loads. We therefore
    // don't need to make the render of the page wait for this data to be fetched.
    loadVersionData(): void {
      // No need for 'await' here - would needlessly block other execution.
      // Just in case this mission-non-critical fetch takes a long time.
      $fetch("/api/versions", {
        onResponse: ({ response }) => {
          const data = response._data;
          if (data.daedalusModel) {
            this.versions = data as VersionData;
          }
        },
      });
    },
  },
});
