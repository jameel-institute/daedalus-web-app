<template>
  <div class="position-relative flex-grow-1">
    <!-- TODO: (jidea-229) For user-provided custom options, consider using hideSelectedOptons prop, introduced in a later
      VueSelect version, to control inclusion in menu. https://github.com/TotomInc/vue3-select-component/issues/233 -->
    <!-- TODO: (jidea-230) For country options, consider using getOptionLabel prop to insert country flag in menu option -->
    <VueSelect
      ref="vueSelectComponent"
      v-model="selected"
      input-id="scenarioOptions"
      :is-menu-open="menuOpen"
      :aria="{ labelledby: labelId, required: true }"
      class="form-control"
      :class="showFeedback ? 'is-invalid' : ''"
      :options="nonBaselineSelectOptions"
      :is-clearable="false"
      :is-multi="true"
      :close-on-select="false"
      :placeholder="`Select up to ${MAX_SCENARIOS_COMPARED_TO_BASELINE} options to compare against baseline`"
      @menu-opened="menuOpen = true"
      @menu-closed="menuOpen = false"
    >
      <template #option="{ option }">
        <div class="parameter-option">
          <span
            v-if="countryFlagIds[option.value]"
            :class="`fi fi-${countryFlagIds[option.value]} ms-1 me-2`"
          />
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
    </VueSelect>
    <div v-if="showFeedback" class="invalid-tooltip">
      {{ feedback }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import type { Parameter } from "~/types/parameterTypes";
import { MAX_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";
import { sortOptions } from "~/components/utils/parameters";
import { countryFlagIconId } from "~/components/utils/countryFlag";

const { showFeedback, parameterAxis, labelId } = defineProps<{
  showFeedback: boolean
  parameterAxis: Parameter
  labelId: string
}>();

const menuOpen = ref(false);

const selected = defineModel("selected", {
  type: Array<string>,
  required: true,
  get: value => sortOptions(parameterAxis, value),
});

const { nonBaselineSelectOptions } = useScenarioOptions(() => parameterAxis);
const { feedback } = useComparisonValidation(selected);
const appStore = useAppStore();

const VALUE_CONTAINER_SELECTOR = ".value-container.multi";
const SEARCH_INPUT_SELECTOR = "input.search-input";
const vueSelect = useTemplateRef<ComponentPublicInstance>("vueSelectComponent");
const vueSelectControl = computed((): HTMLElement | null => {
  return vueSelect.value?.$el.querySelector(VALUE_CONTAINER_SELECTOR);
});
const searchInput = computed(() => vueSelectControl.value?.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR));

const allScenariosSelected = computed(() => {
  return selected.value.length === nonBaselineSelectOptions.value.length;
});

const countryFlagIds = computed(() => {
  if (parameterAxis !== appStore.globeParameter) {
    return {};
  }

  return nonBaselineSelectOptions.value.reduce((acc, option) => {
    acc[option.value] = countryFlagIconId(option.value) || "";
    return acc;
  }, {} as { [key: string]: string });
});

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
