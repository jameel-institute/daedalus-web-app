import type { EventHandler, H3Event } from "h3";
import type { CachedEventHandlerOptions } from "nitropack";
import type { ApiResponse } from "@/types/daedalusApiResponseTypes";

const defaultCacheDurationInSeconds = 0;

// A wrapper for Nuxt's defineEventHandler that handles errors from the R API.
export const defineRApiEventHandler = (
  callback: (event: H3Event) => Promise<ApiResponse>,
  cacheOptions: CachedEventHandlerOptions,
): EventHandler =>
  defineCachedEventHandler(async (event) => {
    const response = await callback(event) as ApiResponse;

    if (response.errors || !response.data) {
      throw createError({
        statusCode: response.statusCode,
        statusMessage: response.statusText,
        message: errorMessage(response.errors),
        data: response.errors,
      });
    } else {
      return response.data;
    }
  }, { maxAge: defaultCacheDurationInSeconds, ...cacheOptions });
