import type { Parameter, ParameterOption, ParameterSet, RangeData } from "~/types/parameterTypes";
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

// Given a parameter which takes numeric values, and where the RangeData is dependent on another parameter's value,
// and a set of the current parameter values (which could be data in a form, or a current scenario),
// retrieve the RangeData (e.g. min, max and default).
export const getRangeForDependentParam = (
  dependentParam: Parameter | undefined,
  parameterValueSet: ParameterSet | undefined,
): RangeData | undefined => {
  if (!dependentParam?.updateNumericFrom || !parameterValueSet) {
    return;
  }

  const dependedOnParamId = dependentParam.updateNumericFrom.parameterId;
  const dependedOnParamInputVal = parameterValueSet[dependedOnParamId];
  if (dependentParam.updateNumericFrom && typeof dependedOnParamInputVal !== "undefined") {
    return dependentParam.updateNumericFrom?.values[dependedOnParamInputVal.toString()];
  }
};
