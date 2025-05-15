// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableInteger = (num: string): string => {
  return new Intl.NumberFormat().format(Number.parseInt(num));
};

export const gdpReferenceYear = "2018";
export const gdpReference = `of ${gdpReferenceYear} national GDP`;

export const humanReadablePercentOfGdp = (num: number): { percent: string, reference: string } => {
  return {
    percent: `${num.toFixed(1)}%`,
    reference: gdpReference,
  };
};
