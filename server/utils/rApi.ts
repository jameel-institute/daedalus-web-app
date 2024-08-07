import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import type { H3Event } from "h3";

export interface RApiError {
  error: string
  detail: string
}
export interface RApiResponse<T extends object> {
  statusText: string
  statusCode: number
  errors: Array<RApiError> | null
  data: T | null
}

// Wraps Nuxt's $fetch utility, configuring it for the R API.
export const fetchRApi = async <T extends object>(
  endpoint: string,
  options: NitroFetchOptions<NitroFetchRequest> = {},
  event?: H3Event,
): Promise<RApiResponse<T>> => {
  const config = useRuntimeConfig(event); // Must be called from inside the composable function. https://nuxt.com/docs/guide/concepts/auto-imports#vue-and-nuxt-composables

  let errors: Array<RApiError> | null = null;
  let statusCode: number | null = null;
  let statusText = "";
  let data = null;

  const response = await $fetch<RApiResponse<T>>(`${endpoint}`, {
    ...options,
    baseURL: config.rApiBase,
    timeout: 1000, // Prevent hanging if no response
    async onResponse({ response }) {
      statusText = response.statusText;
      statusCode = response.status;
    },
  })
    .catch((error) => {
      if (error?.data?.errors) {
        errors = error.data.errors;
      }
    });

  if (response?.data) {
    data = response.data;
  }

  return (statusCode
    ? {
        statusText,
        statusCode,
        errors,
        data,
      }
    : {
        statusText: "error",
        statusCode: 500,
        errors: [
          {
            error: "Unknown error",
            detail: "No response from the API",
          },
        ],
        data: null,
      }) as RApiResponse<T>;
};
