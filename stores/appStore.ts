import { defineStore } from "pinia";
import type { AppState } from "@/types/storeTypes";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    largeScreen: true,
  }),
});
