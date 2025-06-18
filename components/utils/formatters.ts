// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableInteger = (numString: string): string => {
  const normalizedNumString = numString.replace(/,/g, "");
  return new Intl.NumberFormat().format(Number.parseInt(normalizedNumString));
};
