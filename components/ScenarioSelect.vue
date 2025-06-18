<template>
  <div class="position-relative flex-grow-1">
    <!-- TODO: (jidea-230) For country options, consider using getOptionLabel prop to insert country flag in menu option -->
    <VueSelect
      ref="vueSelectComponent"
      v-model="selected"
      input-id="scenarioOptions"
      :is-menu-open="menuOpen"
      :aria="{ labelledby: labelId, required: true }"
      class="form-control"
      :class="showFeedback ? 'is-invalid' : ''"
      :get-option-label="(option) => formatOptionLabel(parameterAxis, option.label)"
      :options="options"
      :is-clearable="false"
      :is-multi="true"
      :is-taggable="parameterIsNumeric"
      :close-on-select="false"
      :placeholder="`Select up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} options to compare against baseline`"
      @option-created="(value) => handleCreateOption(value)"
      @option-deselected="(option) => handleDeselectOption(option)"
      @menu-opened="menuOpen = true"
      @menu-closed="menuOpen = false"
      @search="(input) => handleInput(input)"
    >
      <template #option="{ option }">
        <div class="parameter-option">
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
      <template #taggable-no-options="{ option }">
        Add custom option: {{ formatOptionLabel(parameterAxis, option) }}
      </template>
    </VueSelect>
    <div v-if="showFeedback" class="invalid-tooltip">
      {{ feedback }}
    </div>
    <!-- TODO: add some help text like 'You can choose from the presets or add a custom option.' for numeric -->
  </div>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { MAX_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import type { ParameterSelectOption } from "./utils/parameters";
import { formatOptionLabel, stringIsInteger } from "./utils/formatters";

const { showFeedback, parameterAxis, labelId } = defineProps<{
  showFeedback: boolean
  parameterAxis: Parameter
  labelId: string
}>();

const menuOpen = ref(false);

const selected = defineModel("selected", { type: Array<string>, required: true });
const previousInput = ref<string>("");

const { nonBaselineSelectOptions } = useScenarioOptions(() => parameterAxis);
const { feedback } = useComparisonValidation(selected, () => parameterAxis);

const VALUE_CONTAINER_SELECTOR = ".value-container.multi";
const SEARCH_INPUT_SELECTOR = "input.search-input";
const customOptions = ref<ParameterSelectOption[]>([]); // for user-defined options
const vueSelect = useTemplateRef<ComponentPublicInstance>("vueSelectComponent");
const vueSelectControl = computed((): HTMLElement | null => vueSelect.value?.$el.querySelector(VALUE_CONTAINER_SELECTOR));
const searchInput = computed(() => vueSelectControl.value?.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR));
const allScenariosSelected = computed(() => selected.value.length === nonBaselineSelectOptions.value.length);
const options = computed(() => [...nonBaselineSelectOptions.value, ...customOptions.value]);
const parameterIsNumeric = computed(() => parameterAxis?.parameterType === TypeOfParameter.Numeric);

const handleCreateOption = (value: string) => {
  customOptions.value.push({
    value,
    label: value,
    description: "",
  });
  selected.value.push(value);
};

const handleDeselectOption = (option: ParameterSelectOption | null) => {
  customOptions.value = customOptions.value.filter(o => o.value !== option?.value);
};

const handleInput = (newInput: string) => {
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

watch(allScenariosSelected, (newValue) => {
  if (newValue) {
    menuOpen.value = false;
  }
});

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
    // Calculate how much the menu needs to be moved down to accommodate the invalid tooltip:
    // = tooltip font size + (2 * tooltip vertical padding) + tooltip margin + form-control bottom padding + arbitrary extra padding
    --vs-menu-offset-top: calc(var(--cui-body-font-size) + (2 * 0.25rem) + 0.1rem + 0.375rem + 0.5rem);
  }

  .search-input::placeholder {
    opacity: 0.5;
  }
}
</style>
