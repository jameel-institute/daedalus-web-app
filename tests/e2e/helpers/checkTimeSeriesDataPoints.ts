import type { Locator } from "playwright/test";
import { expect } from "@playwright/test";
import checkValueIsInRange from "./checkValueIsInRange";

export const numberOfTimePoints = 601;

export const checkTimeSeriesDataPoints = async (
  locator: Locator,
  expectedMaxValue: number,
  tolerance = 0.5,
) => {
  const dataString = await locator.getAttribute("data-summary");
  const data = JSON.parse(dataString!);

  checkValueIsInRange(data.maxValue, expectedMaxValue, tolerance);
  expect(data.dataLength).toBe(numberOfTimePoints);
};

export const checkMultiScenarioTimeSeriesDataPoints = async (
  locator: Locator,
  expectedMaxValues: number[],
  tolerance = 0.5,
) => {
  const dataString = await locator.getAttribute("data-summary");
  const data = JSON.parse(dataString!);

  expectedMaxValues.forEach((expectedMaxValue, i) => {
    checkValueIsInRange(data.maxValues[i], expectedMaxValue, tolerance);
  });

  data.dataLengths.forEach((dataLength: number) => {
    expect(dataLength).toBe(numberOfTimePoints);
  });
};
