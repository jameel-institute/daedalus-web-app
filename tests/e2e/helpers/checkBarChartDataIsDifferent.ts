import { expect } from "@playwright/test";

export default (data1: Highcharts.Series[], data2: Highcharts.Series[]): void => {
  data1.forEach((series: Highcharts.Series, index: number) => {
    if (series.data[0].y !== 0) {
      expect(series.data[0].y).not.toEqual(data2[index].data[0].y);
    }
  });
};
