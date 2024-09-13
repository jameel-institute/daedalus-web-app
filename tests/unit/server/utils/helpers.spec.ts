import { describe, expect, it } from "vitest";

import { formDataToObject } from "@/server/utils/helpers";

describe("formDataToObject", () => {
  it("should convert FormData to an object with correct values, handling single and multiple values for the same key correctly", () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("age", "30");
    formData.append("hobby", "reading");
    formData.append("hobby", "coding");

    const expectedObject = {
      name: "John Doe",
      age: "30",
      hobby: ["reading", "coding"],
    };

    expect(formDataToObject(formData)).toEqual(expectedObject);
  });

  it("should return an empty object for empty FormData", () => {
    const formData = new FormData();
    const expectedObject = {};

    expect(formDataToObject(formData)).toEqual(expectedObject);
  });
});
