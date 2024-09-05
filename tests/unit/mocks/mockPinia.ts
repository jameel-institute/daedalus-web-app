import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import type { AppState } from "@/types/storeTypes";

export const mockPinia = (appState: Partial<AppState> = {}) => {
  const initialState = {
    app: {
      largeScreen: true,
      ...appState,
    },
  };

  return createTestingPinia({ initialState, createSpy: vi.fn });
};
