import type { MetadataResponse } from "~/types/apiResponseTypes";
import { getMetadata } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<MetadataResponse> => {
    const metadataResponse = await getMetadata(event);

    return { ...metadataResponse, data: {
      ...metadataResponse.data,
      parameters: (metadataResponse.data?.parameters ?? []).map((param) => {
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

        const order = ["influenza_1957", "influenza_2009", "influenza_1918", "sars_cov_1", "sars_cov_2_pre_alpha", "sars_cov_2_omicron", "sars_cov_2_delta"];
        if (param.id === "pathogen") {
          return {
            ...param,
            defaultOption: "influenza_1957",
            options: param.options?.toSorted((a, b) => {
              return order.indexOf(a.id) - order.indexOf(b.id);
            }),
          };
        }

        return param;
      }) ?? [],
    } };
  },
);
