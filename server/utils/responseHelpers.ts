import type { ApiError, ApiResponse } from "~/types/apiResponseTypes";

export const apiResponse = <T extends object>(response: RApiResponse<T>) => {
  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data: response?.data as T,
  };
};

export const badRequestResponse = (errors: Array<ApiError>): ApiResponse => {
  return {
    statusText: "Bad Request",
    statusCode: 400,
    errors,
    data: null,
  };
};

export const internalServerErrorResponse = (errors: Array<ApiError>): ApiResponse => {
  return {
    statusText: "Internal Server Error",
    statusCode: 500,
    errors,
    data: null,
  };
};
