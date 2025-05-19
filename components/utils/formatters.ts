// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableInteger = (num: string): string => {
  return new Intl.NumberFormat().format(Number.parseInt(num));
};

export const gdpReferenceYear = "2018";

export const costAsPercentOfGdp = (cost: number | undefined, nationalGdp: number | undefined): number => {
  if (!cost || !nationalGdp) {
    return 0;
  }
  return (cost / nationalGdp) * 100;
};

export const humanReadablePercentOfGdp = (num: number): { percent: string, reference: string } => {
  return {
    percent: `${num.toFixed(1)}%`,
    reference: `of ${gdpReferenceYear} national GDP`,
  };
};
