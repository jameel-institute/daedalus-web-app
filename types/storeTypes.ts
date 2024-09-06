import type { VersionData } from "@/types/apiResponseTypes";

export interface AppState {
  largeScreen: boolean
  versions: VersionData | undefined
};
