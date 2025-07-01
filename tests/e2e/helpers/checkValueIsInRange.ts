import { expect } from "@playwright/test";

export default (value: number, expected: number, tolerance: number) => {
  expect(value).toBeGreaterThanOrEqual(expected * (1 - tolerance));
  expect(value).toBeLessThanOrEqual(expected * (1 + tolerance));
};
