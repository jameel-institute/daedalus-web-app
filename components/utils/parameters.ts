import type { ParameterOption } from "~/types/parameterTypes";
import type { Option } from "vue3-select-component";

export interface ParameterSelectOption extends Option<string> {
  value: string
  label: string
  description: string
}

export const paramOptsToSelectOpts = (options: Array<ParameterOption>): ParameterSelectOption[] => {
  return options?.map(({ id, label, description }) => {
    return {
      value: id,
      label,
      description: description ?? "",
    };
  }) || [];
};
