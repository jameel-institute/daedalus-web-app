import JSSHA from "jssha";

import type { ApiError } from "@/types/apiResponseTypes";
import type { ParameterDict } from "~/types/apiRequestTypes";
import { getVersionData } from "../handlers/versions";

// Convert list of error objects to string
export const errorMessage = (errors: Array<ApiError> | null) => {
  return errors?.map((apiError) => {
    return [apiError.error, apiError.detail].join(": ");
  }).join(", ");
};

// Convert FormData to Object. It is designed to be able to cope with multiselects and checkboxes. https://stackoverflow.com/a/46774073
export const formDataToObject = (formData: FormData) => {
  const object: { [key: string]: any } = {};
  formData.forEach((value, key) => {
    if (!Reflect.has(object, key)) {
      object[key] = value;
      return;
    }
    if (!Array.isArray(object[key])) {
      object[key] = [object[key]];
    }
    object[key].push(value);
  });
  return object;
};

export const hashParameters = (parameters: ParameterDict, modelVersion: string) => {
  const sha256 = new JSSHA("SHA-256", "TEXT");
  sha256.update(JSON.stringify({ ...parameters, modelVersion }));
  return sha256.getHash("HEX");
};

export const getModelVersion = async () => {
  const versionResponse = await getVersionData();
  return versionResponse.data?.daedalusModel;
};
