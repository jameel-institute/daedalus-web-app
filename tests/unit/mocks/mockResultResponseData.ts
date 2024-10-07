import sampleResultResponse from "@/mocks/responses/results.json";
import { InterventionLevel } from "~/types/resultTypes";

// Replace string values with equivalent enum values, for the sake of TS typing.
export const mockResultResponseData = {
  ...sampleResultResponse.data,
  interventions: sampleResultResponse.data.interventions.map(intervention => ({
    ...intervention,
    level: intervention.level === "light" ? InterventionLevel.Light : InterventionLevel.Heavy,
  })),
};
