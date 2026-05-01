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
    const expectedHash = "f26fb3d5f0dc922ffc5f90bd606812e718e004dcc6fc95c9ca81c7ea04973473";

    expect(hashParameters(parameters, modelVersion, rApiVersion)).toEqual(expectedHash);
    expect(hashParameters(parameters, "9.9.9", rApiVersion)).not.toEqual(expectedHash);
    expect(hashParameters(parameters, modelVersion, "9.9.9")).not.toEqual(expectedHash);
    expect(hashParameters(parameters, modelVersion, "9.9.9")).not.toEqual(hashParameters(parameters, "9.9.9", rApiVersion));
    expect(hashParameters(reorderedParameters, modelVersion, rApiVersion)).toEqual(expectedHash);
    expect(hashParameters(parametersWithSwappedValues, modelVersion, rApiVersion)).not.toEqual(expectedHash);
  });

  it("should generate different hashes for model/R-API boundary-collision cases to prevent ambiguity", () => {
    // Regression test: ensure hashParameters separates modelVersion and rApiVersion unambiguously
    // e.g., modelVersion="1" + rApiVersion="23" should not collide with modelVersion="12" + rApiVersion="3"
    const parameters = {
      param1: "value1",
      param2: "value2",
    };
    const modelVersion = "0.0.1";
    const rApiVersion = "1.2.3";
    const expectedHash = "f26fb3d5f0dc922ffc5f90bd606812e718e004dcc6fc95c9ca81c7ea04973473";

    // Verify the expected case still matches
    expect(hashParameters(parameters, modelVersion, rApiVersion)).toEqual(expectedHash);

    // Swapping daedalusModel (modelVersion) and daedalusApi (rApiVersion) must produce a different hash,
    // confirming the two slots are treated distinctly even when neither triggers a boundary collision.
    expect(hashParameters(parameters, rApiVersion, modelVersion)).not.toEqual(expectedHash);

    // Test ambiguous boundary pairs
    const hash1_23 = hashParameters(parameters, "1", "23");
    const hash12_3 = hashParameters(parameters, "12", "3");

    // These should produce different hashes (no collision)
    expect(hash1_23).not.toEqual(hash12_3);

    // Neither should match the expected hash
    expect(hash1_23).not.toEqual(expectedHash);
    expect(hash12_3).not.toEqual(expectedHash);
  });
});
