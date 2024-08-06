import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import type { FetchError } from "ofetch";
import type { H3Event } from "h3";

interface RApiError {
  error: string
  detail: string
}

export interface RApiResponse {
  status: string
  errors: Array<RApiError> | null
  data: object | null
}

// Make reading errors more convenient for developers
const errorInformationString = (error: FetchError) => {
  return error.data?.errors?.map((e: RApiError) => {
    return [e.error, e.detail].join(": ");
  }).join(", ");
};

// Wraps Nuxt's $fetch utility, configuring it for the R API.
export const fetchRApi = async <T extends RApiResponse>(
  endpoint: string,
  options: NitroFetchOptions<NitroFetchRequest> = {},
  event?: H3Event,
) => {
  const config = useRuntimeConfig(event); // Must be called from inside the composable function. https://nuxt.com/docs/guide/concepts/auto-imports#vue-and-nuxt-composables

  return await $fetch<T>(endpoint, {
    ...options,
    baseURL: config.rApiBase,
  }).catch((error) => {
    console.error("R API fetch error:", error);
    console.error(errorInformationString(error));

    throw createError({
      statusCode: 500,
      message: "Internal Server Error",
      data: {
        rApiStatusCode: error.response?.status,
        rApiResponseBody: error.data,
        rApiResponseErrors: errorInformationString(error),
      },
    });
  });
};
