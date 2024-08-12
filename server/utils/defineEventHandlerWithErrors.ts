import type { EventHandler, EventHandlerRequest } from "h3";
import type { ApiResponse } from "@/types/daedalusApiResponseTypes";

export const defineEventHandlerWithErrors = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
): EventHandler<T, D> =>
  defineEventHandler<T>(async (event) => {
    const response = await handler(event) as ApiResponse;

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
