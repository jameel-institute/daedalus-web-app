import getCountryISO2 from "country-iso-3-to-2";

// Some flags have enough white on their edges that they need a border to look right on a white background.
export const flagsRequiringBorder = [
  "CAN",
  "CHL",
  "CYP",
  "CZE",
  "EST",
  "FIN",
  "IDN",
  "ISR",
  "JPN",
  "MLT",
  "PHL",
  "POL",
  "RUS",
  "SGP",
  "SVK",
  "SVN",
  "KOR",
];

const countryFlagIconId = (countryISO3: string | undefined): string | undefined => {
  const countryISO2 = getCountryISO2(countryISO3);
  return countryISO2?.toLowerCase();
};

export const countryFlagClass = (countryISO3: string | undefined) => {
  if (!countryISO3) {
    return;
  }
  return `fi fi-${countryFlagIconId(countryISO3)}${flagsRequiringBorder.includes(countryISO3) ? " border" : ""}`;
};
