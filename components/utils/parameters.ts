import { type Parameter, type ParameterOption, type ParameterSet, TypeOfParameter, type ValueData } from "~/types/parameterTypes";
import type { Option } from "vue3-select-component";

export interface ParameterSelectOption extends Option<string> {
  value: string
  label: string
  description: string
}

export const paramOptsToSelectOpts = (options: Array<ParameterOption>): ParameterSelectOption[] => {
  return options.map(({ id, label, description }) => {
    return {
      value: id,
      label,
      description: description ?? "",
    };
  });
};

const getIndexOfOption = (options: Array<ParameterOption> = [], optionId: string): number => {
  return options.findIndex(option => option.id === optionId);
};

// If the parameter is ordered, sort the options based on their order in the metadata.
export const sortOptions = (parameter: Parameter, optionsToSort: string[]) => {
  if (parameter.parameterType === "numeric") {
    return optionsToSort.sort((a, b) => {
      return Number.parseInt(a) - Number.parseInt(b);
    });
  }

  if (!parameter.ordered || parameter.options === undefined) {
    // Special case for unordered parameters where a 'none' option exists: such parameters can be considered semi-ordered and 'none' will be placed at the start.
    return optionsToSort.sort((a, b) => Number(b === "none") - Number(a === "none"));
  }

  return optionsToSort.sort((a, b) => {
    return getIndexOfOption(parameter.options, a) - getIndexOfOption(parameter.options, b);
  });
};

// Given a numeric parameter where the ValueData is dependent on another parameter's value,
// and the current values for each parameter (which could be data in a form, or a current scenario),
// retrieve the ValueData (e.g. min, max and default).
export const getRangeForDependentParam = (
  dependentParam: Parameter | undefined,
  parameterValueSet: ParameterSet | undefined,
): ValueData | undefined => {
  if (!dependentParam?.updateNumericFrom || !parameterValueSet) {
    return;
  }

  const dependedOnParamId = dependentParam.updateNumericFrom.parameterId;
  const dependedOnParamInputVal = parameterValueSet[dependedOnParamId];
  if (dependentParam.updateNumericFrom && typeof dependedOnParamInputVal !== "undefined") {
    return dependentParam.updateNumericFrom?.values[dependedOnParamInputVal.toString()];
  }
};

// Given a numeric parameter where the ValueData is dependent on another parameter's value,
// and the current values for each parameter (which could be data in a form, or a current scenario),
// check whether the numeric value is out of the range defined by the metadata.
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
