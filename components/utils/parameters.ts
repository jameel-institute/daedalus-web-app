import type { Parameter, ParameterOption } from "~/types/parameterTypes";
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
    // Special case for unordered parameters where a 'none' option exists: such parameters can be considered semi-ordered.
    return optionsToSort.sort((a, b) => Number(b === "none") - Number(a === "none"));
  }

  return optionsToSort.sort((a, b) => {
    return getIndexOfOption(parameter.options, a) - getIndexOfOption(parameter.options, b);
  });
};
