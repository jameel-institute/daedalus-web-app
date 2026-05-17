import type { MetadataResponse } from "~/types/apiResponseTypes";
import { getMetadata } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<MetadataResponse> => {
    const metadataResponse = await getMetadata(event);

    return { ...metadataResponse, data: {
      ...metadataResponse.data,
      parameters: metadataResponse.data?.parameters.map((param) => {
        if (param.id === "hospital_capacity") {
          return {
            ...param,
            step: 1000,
            updateNumericFrom: {
              ...param.updateNumericFrom!,
              values: {
                ...param.updateNumericFrom!.values,
                VNM: {
                  min: 38000,
                  default: 38000,
                  max: 50000,
                },
              },
            },
          };
        };

        if (param.id === "response") {
          return {
            ...param,
            defaultOption: "elimination",
          };
        }

        return param;
      }) ?? [],
    } };
  },
);
