<template>
  <div class="position-relative flex-grow-1">
    <VueSelect
      ref="vueSelectComponent"
      v-model="selected"
      input-id="scenarioOptions"
      :is-menu-open="menuOpen"
      :aria="{ labelledby: labelId, required: true }"
      class="form-control"
      :class="[
        showValidationFeedback ? 'is-invalid' : '',
        showWarning ? 'has-warning' : '',
      ]"
      :options="options"
      :is-clearable="false"
      :is-multi="true"
      :is-taggable="parameterIsNumeric"
      :filter-by="filterBy"
      :close-on-select="false"
      :placeholder="`Select up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} options to compare against baseline`"
      @option-created="(value) => handleCreateOption(value)"
      @option-deselected="(option) => option ? handleDeselectOption(option.value) : null"
      @menu-opened="menuOpen = true"
      @menu-closed="menuOpen = false"
      @search="(input) => handleInput(input)"
    >
      <template #option="{ option }">
        <div class="parameter-option">
          <!-- TODO: (jidea-230) For country options, consider inserting country flag in menu option -->
          <span>{{ option.label }}</span>
          <div
            v-if="option.description"
            class="text-muted"
          >
            <small>{{ option.description }}</small>
          </div>
        </div>
      </template>
      <template #no-options>
        {{ allScenariosSelected ? 'All options selected.' : 'No options found.' }}
      </template>
      <template v-if="true" #tag="{ option, removeOption }">
        <button
          type="button"
          class="multi-value"
          :class="{
            'bg-warning text-white': isOutOfRange(option.value),
          }"
          @click="removeOption"
        >
          {{ option.label }}
          <CIcon
            size="sm"
            class="text-secondary"
            :class="{
              'text-white': isOutOfRange(option.value),
            }"
            icon="cilX"
            style="margin-bottom: 0.3rem"
          />
        </button>
      </template>
      <template v-if="parameterIsNumeric" #menu-header>
        <p v-if="!currentInput" class="m-2">
          {{ `Type a number to add a custom option${
            allScenariosSelected ? '' : `, or select a pre-defined value from the list below.`}`
          }}
        </p>
      </template>
      <template v-if="parameterIsNumeric" #taggable-no-options="{ option }">
        <span class="small">
          <span v-if="optionAlreadySelected(option)" class="text-secondary">
            {{ formatOptionLabel(parameterAxis, option) }} is already selected.
          </span>
          <span v-else>
            Press enter to add custom option: {{ formatOptionLabel(parameterAxis, option) }}
            <p v-if="isOutOfRange(option)" class="text-secondary small mb-0">
              NB: This value is outside the estimated range for {{ estimatedRangeText }}.
            </p>
          </span>
        </span>
      </template>
    </VueSelect>
    <div v-if="showValidationFeedback" class="invalid-tooltip">
      <span v-if="tooFewScenarios">
        Please select at least {{ MIN_SCENARIOS_COMPARED_TO_BASELINE }} scenario to compare against the baseline.
      </span>
      <span v-else-if="tooManyScenarios">
        You can compare up to {{ MAX_SCENARIOS_COMPARED_TO_BASELINE }} scenarios against the baseline.
      </span>
      <span v-else-if="numericInvalid">
        Some of the selected scenarios are not valid numbers.
      </span>
    </div>
    <div v-else-if="showWarning" class="invalid-tooltip bg-warning">
      {{ valuesOutOfRange.length === 1 ? 'One' : 'Some' }} of the values ({{ valuesOutOfRange.join(", ") }})
      {{ valuesOutOfRange.length === 1 ? 'lies' : 'lie' }} outside of the estimated range for {{ estimatedRangeText }}.
      Proceed with caution.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { MAX_SCENARIOS_COMPARED_TO_BASELINE, MIN_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import type { ParameterSelectOption } from "./utils/parameters";
import { formatOptionLabel, stringIsInteger } from "./utils/formatters";
import { getRangeForDependentParam, sortOptions } from "./utils/parameters";
import { numericValueIsOutOfRange } from "~/components/utils/validations";

const { showValidationFeedback, parameterAxis, labelId } = defineProps<{
  showValidationFeedback: boolean
  parameterAxis: Parameter
  labelId: string
}>();

const menuOpen = ref(false);

const selected = defineModel("selected", {
  type: Array<string>,
  required: true,
  get: value => sortOptions(parameterAxis, value),
});
const previousInput = ref<string>("");
const currentInput = ref<string>("");

const { baselineOption, dependedOnParamOptionLabel, nonBaselineSelectOptions } = useScenarioOptions(() => parameterAxis);
const { tooFewScenarios, tooManyScenarios, numericInvalid } = useComparisonValidation(selected, () => parameterAxis);

const VALUE_CONTAINER_SELECTOR = ".value-container.multi";
const SEARCH_INPUT_SELECTOR = "input.search-input";
const customOptions = ref<ParameterSelectOption[]>([]); // for user-defined options
const vueSelect = useTemplateRef<ComponentPublicInstance>("vueSelectComponent");

const appStore = useAppStore();
const vueSelectControl = computed((): HTMLElement | null => vueSelect.value?.$el.querySelector(VALUE_CONTAINER_SELECTOR));
const searchInput = computed(() => vueSelectControl.value?.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR));
const allScenariosSelected = computed(() => nonBaselineSelectOptions.value.every(o => selected.value.includes(o.value)));
const options = computed(() => [...nonBaselineSelectOptions.value, ...customOptions.value]);
const parameterIsNumeric = computed(() => parameterAxis?.parameterType === TypeOfParameter.Numeric);
const dependentRange = computed(() => getRangeForDependentParam(parameterAxis, appStore.currentScenario.parameters));
const estimatedRangeText = computed(() => `${dependedOnParamOptionLabel.value} (${dependentRange.value?.min}–${dependentRange.value?.max})`);

const isOutOfRange = (value: string) => numericValueIsOutOfRange(value, parameterAxis, appStore.currentScenario.parameters);

const valuesOutOfRange = computed(() => selected.value.concat(baselineOption.value?.id ?? []).filter(o => isOutOfRange(o)));
const showWarning = computed(() => parameterIsNumeric.value && valuesOutOfRange.value.length > 0);

const optionAlreadySelected = (value: string) => selected.value.includes(value);

const filterBy = (_option: ParameterSelectOption, label: string, search: string) => {
  if (parameterIsNumeric.value) {
    // Show all options if there is nothing in the 'search' input, otherwise list only the candidate custom input.
    return !currentInput.value;
  }
  // If parameter is not numeric, use the default filter logic, which is defined at: https://vue3-select-component.vercel.app/props.html#filterby
  return label.toLowerCase().includes(search.toLowerCase());
};

const handleCreateOption = (value: string) => {
  if (!parameterIsNumeric.value) {
    return;
  }

  if (optionAlreadySelected(value)) {
    return;
  }

  customOptions.value.push({
    value,
    label: formatOptionLabel(parameterAxis, value),
    description: "",
  });
  selected.value.push(value);
};

// Remove the option from custom options so that it isn't listed in the menu.
const handleDeselectOption = (value: string) => customOptions.value = customOptions.value.filter(o => o.value !== value);

// This watch is required, in addition to the deselection handler handleDeselectOption, because
// *backspace* deselect does not trigger the option-deselected event:
// https://github.com/TotomInc/vue3-select-component/issues/296
watch(selected, (newValue, oldValue) => {
  // If the oldValue is the same as the newValue except for a single option, we infer that
  // that option has been deselected.
  const deselectedOptions = oldValue?.filter(option => !newValue.includes(option));
  if (deselectedOptions?.length === 1) {
    handleDeselectOption(deselectedOptions[0]);
  }
}, { immediate: true });

const handleInput = (newInput: string) => {
  currentInput.value = newInput;

  if (!parameterIsNumeric.value) {
    return;
  }

  if (newInput !== "" && !stringIsInteger(newInput) && searchInput.value) {
    // If the input is not a valid integer, reset the input to the previous valid value
    searchInput.value.value = previousInput.value;
    searchInput.value.dispatchEvent(new Event("input"));
    return;
  }

  previousInput.value = newInput;
};

watch(allScenariosSelected, newValue => newValue ? menuOpen.value = false : null);

onMounted(() => {
  watch(vueSelectControl, () => {
    useEventListener(vueSelectControl.value, "click", (event: MouseEvent) => {
      // Only do anything if the click was on the parent element
      if (event.target === vueSelectControl.value) {
        // If a click is detected in a row-end gap that is created due to flex-wrapping the option tags onto multiple rows,
        // treat it as a click on the search input, that is, open the options menu and focus the search input.
        menuOpen.value = true;
        searchInput.value?.focus();
      }
    });
  }, { immediate: true });
});
</script>

<style lang="scss" scoped>
:deep(.vue-select) {
  --vs-menu-height: max(calc(100dvh - 25rem), 200px);

  ::placeholder {
    font-size: var(--cui-body-font-size);
  }

  &.form-control.is-invalid {
    // Calculate how much the menu needs to be moved down to accommodate the .invalid-tooltip:
    // = tooltip font size + (2 * tooltip vertical padding) + tooltip margin + form-control bottom padding + arbitrary extra padding
    // Assumes a single line of text in the tooltip.
    --vs-menu-offset-top: calc(var(--cui-body-font-size) + (2 * 0.25rem) + 0.1rem + 0.375rem + 0.5rem);
  }

  &.form-control.has-warning {
    // Calculate how much the menu needs to be moved down to accommodate the .invalid-tooltip:
    // = tooltip font size + (2 * tooltip vertical padding) + tooltip margin + form-control bottom padding + arbitrary extra padding
    // Assumes two lines of text in the tooltip.
    --vs-menu-offset-top: calc(var(--cui-body-font-size) + (2 * 0.25rem) + 0.1rem + 0.375rem + 1.8rem);
  }

  &.form-control.has-warning ~ .invalid-tooltip {
    display: block !important;
  }

  .search-input::placeholder {
    opacity: 0.5;
  }
}
</style>
