import type { Locator } from "playwright/test";
import { expect } from "@playwright/test";
import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import checkValueIsInRange from "./checkValueIsInRange";

export const numberOfTimePoints = 601;

export const checkTimeSeriesDataPoints = async (
  locator: Locator,
  expectedFirstDataPoint: TimeSeriesDataPoint,
  expectedLastDataPoint: TimeSeriesDataPoint,
  tolerance = 0.5,
) => {
  const dataString = await locator.getAttribute("data-summary");
  const data = JSON.parse(dataString!);

  const [firstX, firstY] = data.firstDataPoint;
  const [lastX, lastY] = data.lastDataPoint;

  checkValueIsInRange(firstX, expectedFirstDataPoint[0], tolerance);
  checkValueIsInRange(firstY, expectedFirstDataPoint[1], tolerance);
  checkValueIsInRange(lastX, expectedLastDataPoint[0], tolerance);
  checkValueIsInRange(lastY, expectedLastDataPoint[1], tolerance);
  expect(data.dataLength).toBe(numberOfTimePoints);
};
