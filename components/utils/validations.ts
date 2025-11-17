import { type Parameter, type ParameterSet, TypeOfParameter } from "~/types/parameterTypes";
import { getRangeForDependentParam } from "./parameters";

// Given a parameter which takes numeric values, and where the RangeData is dependent on another parameter's value,
// and a set of the current parameter values (which could be data in a form, or a current scenario),
// check whether the numeric value is outside of the range defined by the metadata.
export const numericValueIsOutOfRange = (
  value: string | undefined,
  parameter: Parameter | undefined,
  parameterValueSet: ParameterSet | undefined,
) => {
  if (!value || parameter?.parameterType !== TypeOfParameter.Numeric) {
    return false;
  }

  const int = Number.parseInt(value);
  const range = getRangeForDependentParam(parameter, parameterValueSet);

  return range && (int < range.min || int > range.max);
};

export const numericValueInvalid = (
  value: string,
  param: Parameter,
) => {
  if (!value) {
    return true;
  }

  return param.parameterType === TypeOfParameter.Numeric
    && (!(Number(value) > 0) || Number.isNaN(Number(value)));
};
