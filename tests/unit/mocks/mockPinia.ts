import type { AppState } from "@/types/storeTypes";
import sampleMetadataResponse from "@/mocks/responses/metadata.json";
import { createTestingPinia } from "@pinia/testing";
import type { Metadata, ResultsMetadata } from "~/types/apiResponseTypes";
import { TypeOfParameter } from "~/types/parameterTypes";
import { InterventionLevel } from "~/types/resultTypes";

const globeParameter = {
  id: "region",
  label: "Region",
  parameterType: TypeOfParameter.GlobeSelect,
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
    parameterType: TypeOfParameter.Select,
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
    parameterType: TypeOfParameter.Select,
    defaultOption: "no",
    ordered: false,
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    updateNumericFrom: null,
  },
];

export const updatableNumericParameter = {
  id: "population",
  label: "Population",
  parameterType: TypeOfParameter.Numeric,
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
Object.freeze(mockedMetadata);

export const mockResultData = {
  runId: "successfulResponseRunId",
  parameters: {
    country: "United Kingdom",
    pathogen: "sars_cov_1",
    response: "none",
    vaccine: "none",
    hospital_capacity: "30500",
  },
  costs: [
    {
      id: "total",
      value: 1086625.0137,
      children: [
        {
          id: "gdp",
          value: 52886.8372,
          children: [
            {
              id: "gdp_closures",
              value: 0,
            },
            {
              id: "gdp_absences",
              value: 52886.8372,
            },
          ],
        },
        {
          id: "education",
          value: 4154.9456,
          children: [
            {
              id: "education_closures",
              value: 0,
            },
            {
              id: "education_absences",
              value: 4154.9456,
            },
          ],
        },
        {
          id: "life_years",
          value: 1029583.2309,
          children: [
            {
              id: "life_years_infants",
              value: 882.054,
            },
            {
              id: "life_years_adolescents",
              value: 33273.6856,
            },
            {
              id: "life_years_working_age",
              value: 993899.3885,
            },
            {
              id: "life_years_retirement_age",
              value: 1528.1028,
            },
          ],
        },
      ],
    },
  ],
  capacities: [
    {
      id: "hospital_capacity",
      value: 40000,
    },
    {
      id: "icu_capacity",
      value: 5000,
    },
  ],
  interventions: [
    {
      id: "school_closures",
      level: InterventionLevel.Light,
      start: 1,
      end: 4,
    },
    {
      id: "business_closures",
      level: InterventionLevel.Heavy,
      start: 3,
      end: 8,
    },
  ],
  time_series: {
    infect: [
      67.886,
      56.4939,
      59.2434,
      70.9342,
    ],
    hospitalised: [
      0,
      3.9626,
      6.8824,
      9.4865,
    ],
    dead: [
      0,
      0.0244,
      0.0878,
      0.1825,
    ],
  },
};
Object.freeze(mockResultData);

export const emptyScenario = {
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
};
Object.freeze(emptyScenario);

export const mockPinia = (appState: Partial<AppState> = {}, includeMetadata: boolean = true, stubActions = true) => {
  const initialState = {
    app: {
      largeScreen: true,
      versions: undefined,
      metadata: includeMetadata ? { ...mockedMetadata } : undefined,
      metadataFetchError: undefined,
      metadataFetchStatus: includeMetadata ? "success" : undefined,
      currentScenario: emptyScenario,
      downloading: false,
      downloadError: undefined,
      ...appState,
    },
  };

  return createTestingPinia({ initialState, createSpy: vi.fn, stubActions });
};
