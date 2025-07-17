import { formDataToObject, getModelVersion, hashParameters } from "@/server/utils/helpers";

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
  it("should return the correct hash for the given parameters and model version, insensitive to order", () => {
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
    const expectedHash = "b25974cca561836f5c342c87e3e8c99c32d67a5d14c61d34cef22a10534a9ddb";

    expect(hashParameters(parameters, modelVersion)).toEqual(expectedHash);
    expect(hashParameters(parameters, "9.9.9")).not.toEqual(expectedHash);
    expect(hashParameters(reorderedParameters, modelVersion)).toEqual(expectedHash);
    expect(hashParameters(parametersWithSwappedValues, modelVersion)).not.toEqual(expectedHash);
  });
});

describe("getModelVersion", () => {
  it("should return the model version from the version data response", async () => {
    vi.mock("@/server/handlers/versions", () => ({
      getVersionData: () => ({
        data: {
          daedalusModel: "3.3.3",
        },
      }),
    }));

    expect(await getModelVersion()).toBe("3.3.3");
  });
});
