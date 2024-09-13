import type { FetchError } from "ofetch";
import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, VersionData } from "@/types/apiResponseTypes";

export interface AppState {
  largeScreen: boolean
  versions: VersionData | undefined
  metadata: Metadata | undefined
  metadataFetchError: FetchError | undefined
  metadataFetchStatus: AsyncDataRequestStatus | undefined
};
