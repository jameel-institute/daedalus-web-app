import type { Locator } from "playwright/test";
import { expect } from "@playwright/test";

type DataPoint = [number, number];

const checkValueIsInRange = (value: number, expected: number, tolerance: number) => {
  expect(value).toBeGreaterThanOrEqual(expected * (1 - tolerance));
  expect(value).toBeLessThanOrEqual(expected * (1 + tolerance));
};

export const checkTimeSeriesDataPoints = async (
  locator: Locator,
  expectedFirstDataPoint: DataPoint,
  expectedLastDataPoint: DataPoint,
  tolerance = 0.5,
) => {
  const testData = await locator.getAttribute("data-test");
  const data = JSON.parse(testData!);

  const [firstX, firstY] = data.firstDataPoint;
  const [lastX, lastY] = data.lastDataPoint;

  checkValueIsInRange(firstX, expectedFirstDataPoint[0], tolerance);
  checkValueIsInRange(firstY, expectedFirstDataPoint[1], tolerance);
  checkValueIsInRange(lastX, expectedLastDataPoint[0], tolerance);
  checkValueIsInRange(lastY, expectedLastDataPoint[1], tolerance);
};
