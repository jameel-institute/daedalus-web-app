import type { ApiError } from "@/types/daedalusApiResponseTypes";

// Convert list of error objects to string
export const errorMessage = (errors: Array<ApiError> | null) => {
  return errors?.map((apiError) => {
    return [apiError.error, apiError.detail].join(": ");
  }).join(", ");
};
