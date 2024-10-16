import sampleMetadataResponse from "@/mocks/responses/metadata.json";
import sampleResultResponse from "@/mocks/responses/results.json";
import { TypeOfParameter } from "~/types/parameterTypes";
import { InterventionLevel } from "~/types/resultTypes";

// Replace string values with equivalent enum values, for the sake of TS typing.
export const mockResultResponseData = {
  ...sampleResultResponse.data,
  interventions: sampleResultResponse.data.interventions.map(intervention => ({
    ...intervention,
    level: intervention.level === "light" ? InterventionLevel.Light : InterventionLevel.Heavy,
  })),
};

const paramTypeAsEnum = (parameterType: string): TypeOfParameter => {
  if (parameterType === "select") {
    return TypeOfParameter.Select;
  } else if (parameterType === "globeSelect") {
    return TypeOfParameter.GlobeSelect;
  } else {
    return TypeOfParameter.Numeric;
  }
};

export const mockMetadataResponseData = {
  ...sampleMetadataResponse.data,
  parameters: sampleMetadataResponse.data.parameters.map((parameter) => {
    return {
      ...parameter,
      parameterType: paramTypeAsEnum(parameter.parameterType),
    };
  }),
};
