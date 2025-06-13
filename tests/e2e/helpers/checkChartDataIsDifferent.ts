import type { Series } from "highcharts";
import { expect } from "@playwright/test";

export const checkBarChartDataIsDifferent = (data1: Series[], data2: Series[]): void => {
  data1.forEach((series: Series, index: number) => {
    if (series.data[0].y !== 0) {
      expect(series.data[0].y).not.toEqual(data2[index].data[0].y);
    }
  });
};
