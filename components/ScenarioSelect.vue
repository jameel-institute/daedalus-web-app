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
          <div class="d-flex gap-3 me-2">
            <span id="optionLabel">
              {{ option.label }}
            </span>
            <span class="flex-grow-1">
              <CFormRange
                v-if="parameterAxis?.parameterType === TypeOfParameter.Numeric"
                :id="option.label"
                :disabled="true"
                :min="parseInt(nonBaselineOptions[0].id)"
                :max="parseInt(nonBaselineOptions[(nonBaselineOptions.length - 1)].id)"
                :step="100"
                :model-value="option.value"
              />
            </span>
          </div>
          <div
            v-if="option.description"
            class="text-muted"
          >
            <CIcon
              v-if="option.value === defaultNumericOption?.id"
              icon="cilStar"
              class="text-muted me-1"
            />
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
import { CIcon } from "@coreui/icons-vue";
import { TypeOfParameter } from "~/types/parameterTypes";
import type { Parameter } from "~/types/parameterTypes";
import { MAX_SCENARIOS_COMPARED_TO_BASELINE } from "~/components/utils/comparisons";

const { showFeedback, parameterAxis, labelId } = defineProps<{
  showFeedback: boolean
  parameterAxis: Parameter | undefined
  labelId: string
}>();

const menuOpen = ref(false);

const selected = defineModel("selected", { type: Array<string>, required: true });

const { nonBaselineSelectOptions, defaultNumericOption, nonBaselineOptions } = useScenarioOptions(() => parameterAxis);
const { feedback } = useComparisonValidation(selected);

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
