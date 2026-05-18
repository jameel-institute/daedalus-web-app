import type { H3Event } from "h3";
import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import process from "node:process";

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

export const R_API_REQUEST_STAGGER_MS = 100;

// In-memory scheduling staggers requests within one Nitro worker; separate
// worker processes maintain independent schedules.
let nextRApiRequestStart = 0;
let rApiRequestSlotQueue = Promise.resolve();

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Test-only helper; do not call during request handling.
export const resetRApiRequestStagger = () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetRApiRequestStagger must only be used in tests.");
  }
  nextRApiRequestStart = 0;
  rApiRequestSlotQueue = Promise.resolve();
};

export const waitForRApiRequestSlot = async () => {
  rApiRequestSlotQueue = rApiRequestSlotQueue.then(async () => {
    const now = Date.now();
    const requestStart = Math.max(now, nextRApiRequestStart);
    nextRApiRequestStart = requestStart + R_API_REQUEST_STAGGER_MS;

    const delay = requestStart - now;
    if (delay > 0) {
      await wait(delay);
    }
  });

  await rApiRequestSlotQueue;
};

// Wraps Nuxt's $fetch utility, configuring it for the R API.
export const fetchRApi = async <T extends object>(
  endpoint: string,
  options: NitroFetchOptions<NitroFetchRequest> = {},
  event?: H3Event,
): Promise<RApiResponse<T>> => {
  const config = useRuntimeConfig(event); // Must be called from inside the composable function. https://nuxt.com/docs/guide/concepts/auto-imports#vue-and-nuxt-composables
  await waitForRApiRequestSlot();

  let errors: Array<RApiError> | null = null;
  let statusCode: number | null = null;
  let statusText = "";
  let data = null;

  const response = await $fetch<RApiResponse<T>>(`${endpoint}`, {
    ...options,
    baseURL: config.rApiBase,
    timeout: 500, // Prevent hanging if no response
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
