import { formDataToObject, hashParameters } from "@/server/utils/helpers";

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

describe("hashParameters", () => {
  it("should return the correct hash for the given parameters and model version", () => {
    const parameters = {
      param1: "value1",
      param2: "value2",
    };
    const modelVersion = "0.0.1";
    const expectedHash = "6db749ef194fbb7adf394313514865df2b75614381052e92ba6b4fac0d818f42";

    expect(hashParameters(parameters, modelVersion)).toEqual(expectedHash);
    expect(hashParameters(parameters, "9.9.9")).not.toEqual(expectedHash);
  });
});
