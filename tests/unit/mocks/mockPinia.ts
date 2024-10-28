import type { AppState } from "@/types/storeTypes";
import sampleMetadataResponse from "@/mocks/responses/metadata.json";
import { createTestingPinia, type TestingOptions } from "@pinia/testing";
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
    description: "Drop Down Description",
    parameterType: TypeOfParameter.Select,
    defaultOption: null,
    ordered: false,
    options: [
      { id: "1", label: "Option 1", description: "Option 1 description" },
      { id: "2", label: "Option 2", description: "Option 2 description" },
      { id: "3", label: "Option 3", description: "Option 3 description" },
      { id: "4", label: "Option 4", description: "Option 4 description" },
      { id: "5", label: "Option 5", description: "Option 5 description" },
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
      { id: "yes", label: "Yes", description: "Yes description" },
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
export const countryAndPathogenParams = [
  {
    id: "country",
    label: "Country",
    parameterType: TypeOfParameter.GlobeSelect,
    defaultOption: "THA",
    ordered: false,
    options: [
      { id: "ARG", label: "Argentina" },
      { id: "BRA", label: "Brazil" },
      { id: "CHN", label: "China" },
      { id: "DEU", label: "Germany" },
      { id: "GBR", label: "United Kingdom" },
    ],
  },
  {
    id: "pathogen",
    label: "Disease",
    parameterType: TypeOfParameter.Select,
    defaultOption: null,
    ordered: false,
    options: [
      { id: "sars_cov_1", label: "SARS 2004" },
      { id: "sars_cov_2_pre_alpha", label: "Covid-19 wild-type" },
      { id: "sars_cov_2_omicron", label: "Covid-19 Omicron" },
      { id: "sars_cov_2_delta", label: "Covid-19 Delta" },
      { id: "influenza_2009", label: "Influenza 2009 (Swine flu)" },
      { id: "influenza_1957", label: "Influenza 1957" },
      { id: "influenza_1918", label: "Influenza 1918 (Spanish flu)" },
    ],
    description:
      "Select a disease to set model parameters for transmissibility, incubation period and severity based on known characteristics of that historical epidemic or epidemic wave",
  },
];

const resultsMetadata = sampleMetadataResponse.data.results as ResultsMetadata;
export const mockedMetadata = {
  modelVersion: "0.0.0",
  parameters: [...selectParameters, globeParameter, updatableNumericParameter],
  results: resultsMetadata,
} as unknown as Metadata;
Object.freeze(mockedMetadata);

export const mockResultData = {
  runId: "successfulResponseRunId",
  parameters: {
    country: "GBR",
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
              id: "life_years_pre_school",
              value: 882.054,
            },
            {
              id: "life_years_school_age",
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
    infect: [67.886, 56.4939, 59.2434, 70.9342],
    hospitalised: [0, 3.9626, 6.8824, 9.4865],
    dead: [0, 0.0244, 0.0878, 0.1825],
  },
  gdp: 19863038.6,
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

export const mockVersions = {
  daedalusModel: "1.2.3",
  daedalusApi: "4.5.6",
  daedalusWebApp: "7.8.9",
};
Object.freeze(mockVersions);

export const mockPinia = (
  appState: Partial<AppState> = {},
  includeMetadata: boolean = true,
  testingOpts: Partial<TestingOptions> = {},
) => {
  const initialState = {
    app: {
      globe: {
        interactive: false,
        selectedCountry: undefined,
      },
      largeScreen: true,
      versions: mockVersions,
      metadata: includeMetadata ? { ...mockedMetadata } : undefined,
      metadataFetchError: undefined,
      metadataFetchStatus: includeMetadata ? "success" : undefined,
      currentScenario: emptyScenario,
      downloading: false,
      downloadError: undefined,
      ...appState,
    },
  };

  return createTestingPinia({ initialState, createSpy: vi.fn, ...testingOpts });
};
