// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableNumber = (num: string): string => {
  return new Intl.NumberFormat().format(Number.parseInt(num));
};
