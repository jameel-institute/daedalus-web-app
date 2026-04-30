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
  it("should return the correct hash for the given parameters, model version and R API version, insensitive to order", () => {
    const parameters = {
      param1: "value1",
      param2: "value2",
    };
    const reorderedParameters = {
      param2: "value2",
      param1: "value1",
    };
    const parametersWithSwappedValues = {
      param1: "value2",
      param2: "value1",
    };
    const modelVersion = "0.0.1";
    const rApiVersion = "1.2.3";
    const expectedHash = "b27f9454621989a290b9d493b0ae243f34d1a6aa832778da69e4649457862277";

    expect(hashParameters(parameters, modelVersion, rApiVersion)).toEqual(expectedHash);
    expect(hashParameters(parameters, "9.9.9", rApiVersion)).not.toEqual(expectedHash);
    expect(hashParameters(parameters, modelVersion, "9.9.9")).not.toEqual(expectedHash);
    expect(hashParameters(parameters, modelVersion, "9.9.9")).not.toEqual(hashParameters(parameters, "9.9.9", rApiVersion));
    expect(hashParameters(reorderedParameters, modelVersion, rApiVersion)).toEqual(expectedHash);
    expect(hashParameters(parametersWithSwappedValues, modelVersion, rApiVersion)).not.toEqual(expectedHash);
  });
});
