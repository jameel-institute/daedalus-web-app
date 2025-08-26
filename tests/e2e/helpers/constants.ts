export const runIdMatcher = "[a-f0-9]{32}";
export const scenarioPathMatcher = `scenarios/${runIdMatcher}`;

export const parameterLabels = {
  country: "Country",
  pathogen: "Disease",
  response: "Response",
  vaccine: "Global vaccine investment",
  hospital_capacity: "Hospital surge capacity",
};
Object.freeze(parameterLabels);

export const costTolerance = 0.25;

export const commaSeparatedNumberMatcher = "\\d{1,3}(,\\d{3})*";
export const decimalPercentMatcher = "\\d{1,4}(\\.\\d)?%";
