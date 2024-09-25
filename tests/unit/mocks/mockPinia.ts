import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import type { AppState } from "@/types/storeTypes";

export const mockPinia = (appState: Partial<AppState> = {}) => {
  const initialState = {
    app: {
      largeScreen: true,
      versions: undefined,
      metadata: undefined,
      metadataFetchError: undefined,
      metadataFetchStatus: undefined,
      currentScenario: {
        runId: undefined,
        parameters: undefined,
        result: {
          data: undefined,
          fetchError: undefined,
          fetchStatus: undefined,
        },
        status: {
          data: undefined,
          fetchError: undefined,
          fetchStatus: undefined,
        },
      },
      ...appState,
    },
  };

  return createTestingPinia({ initialState, createSpy: vi.fn });
};
