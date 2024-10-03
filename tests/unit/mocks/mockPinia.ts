import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import type { AppState } from "@/types/storeTypes";
import sampleMetadataResponse from "@/mocks/responses/metadata.json";
import type { Metadata, ResultsMetadata } from "~/types/apiResponseTypes";

const globeParameter = {
  id: "region",
  label: "Region",
  parameterType: "globeSelect",
  defaultOption: "HVN",
  ordered: false,
  options: [
    { id: "CLD", label: "Cloud Nine", description: null },
    { id: "HVN", label: "Heaven", description: null },
  ],
  updateNumericFrom: null,
};

const selectParameters = [
  {
    id: "long_list",
    label: "Drop Down",
    parameterType: "select",
    defaultOption: null,
    ordered: false,
    options: [
      { id: "1", label: "Option 1" },
      { id: "2", label: "Option 2" },
      { id: "3", label: "Option 3" },
      { id: "4", label: "Option 4" },
      { id: "5", label: "Option 5" },
      { id: "6", label: "Option 6" },
    ],
    updateNumericFrom: null,
  },
  {
    id: "short_list",
    label: "Radio Buttons",
    parameterType: "select",
    defaultOption: "no",
    ordered: false,
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    updateNumericFrom: null,
  },
];

const updatableNumericParameter = {
  id: "population",
  label: "Population",
  parameterType: "numeric",
  ordered: false,
  step: 1000,
  defaultOption: null,
  options: [],
  updateNumericFrom: {
    parameterId: "short_list",
    values: {
      yes: {
        min: 11000,
        default: 17000,
        max: 50000,
      },
      no: {
        min: 1000,
        default: 2000,
        max: 4000,
      },
    },
  },
};

const resultsMetadata = sampleMetadataResponse.data.results as ResultsMetadata;
export const mockedMetadata = {
  modelVersion: "0.0.0",
  parameters: [...selectParameters, globeParameter, updatableNumericParameter],
  results: resultsMetadata,
} as Metadata;

export const mockPinia = (appState: Partial<AppState> = {}, includeMetadata: boolean = true) => {
  const initialState = {
    app: {
      largeScreen: true,
      versions: undefined,
      metadata: includeMetadata ? mockedMetadata : undefined,
      metadataFetchError: undefined,
      metadataFetchStatus: includeMetadata ? "success" : undefined,
      downloading: false,
      downloadError: undefined,
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
