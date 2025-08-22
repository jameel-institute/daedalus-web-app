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
