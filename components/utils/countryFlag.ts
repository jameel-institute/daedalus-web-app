import getCountryISO2 from "country-iso-3-to-2";

export const countryFlagIconId = (countryISO3: string | undefined): string | undefined => {
  const countryISO2 = getCountryISO2(countryISO3);
  return countryISO2?.toLowerCase();
};
