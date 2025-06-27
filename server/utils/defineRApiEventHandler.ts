import type { ApiResponse } from "~/types/apiResponseTypes";
import type { EventHandler, H3Event } from "h3";

// A wrapper for Nuxt's defineEventHandler that handles errors from the R API.
export const defineRApiEventHandler = (
  callback: (event: H3Event) => Promise<ApiResponse>,
): EventHandler =>
  defineEventHandler(async (event) => {
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
  });
