export const runIdMatcher = "[a-f0-9]{32}";
export const scenarioPathMatcher = `scenarios/${runIdMatcher}`;

export const parameterLabels = {
  country: "Country",
  pathogen: "Disease",
  response: "Response",
  vaccine: "Global vaccine investment",
  behaviour: "Change in public behaviour",
  hospital_capacity: "Hospital surge capacity",
};
Object.freeze(parameterLabels);

export const costTolerance = 0.5;

export const decimalPercentMatcher = "(\\d{1,4}(\\.(\\d*))?%|<0\\.005%)";
export const decimalUSDMatcher = "(\\$\\d{1,3}(,\\d{3})*(\\.\\d{1,4})?[TBMK]|<\\$1 M)";
export const decimalUSDMatcherAllowNegatives = "(-?\\$\\d{1,3}(,\\d{3})*(\\.\\d{1,4})?[TBMK]|<\\$1 M)";

export const tableRowLabels = [
  "(Net|Total) losses (relative to baseline )?(as % of GDP|\\(USD\\))",
  "GDP",
  "Closures",
  "Absences",
  "Education",
  "Closures",
  "Absences",
  "Life years\\*",
  "Preschool-age children",
  "School-age children",
  "Working-age adults",
  "Retirement-age adults",
];
