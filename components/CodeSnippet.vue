<template>
  <div
    class="d-inline-block"
    :class="[scenarios.length > 1 ? 'multi-scenario' : '']"
  >
    <div v-if="scenarios.length && everyScenarioHasParameters">
      <CTooltip content="Generate code snippet" placement="top">
        <template #toggler="{ togglerId, on }">
          <CButton
            id="btn-code-snippet"
            color="light"
            :aria-describedby="togglerId"
            aria-label="Generate code snippet"
            class="btn-scenario-header"
            v-on="on"
            @click="() => { modalVisible = true; }"
          >
            <CIcon icon="cilCode" size="lg" class="text-muted" />
          </CButton>
        </template>
      </CTooltip>
      <CModal
        :visible="modalVisible"
        aria-labelledby="codeSnippetModalTitle"
        @close="() => { modalVisible = false }"
      >
        <CModalHeader>
          <CModalTitle id="codeSnippetModalTitle">
            DAEDALUS code snippet
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Use this R code snippet to run the model directly with the
            <code>daedalus</code>
            package for the current {{ scenarios.length > 1 ? "scenarios" : "parameters" }}.
            See the
            <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
            <NuxtLink to="https://jameel-institute.github.io/daedalus/" target="_blank">daedalus documentation</NuxtLink> for
            installation instructions and further details.
          </p>
          <div class="code p-3 overflow-y-auto">
            <button
              id="btn-copy-code"
              class="btn btn-clipboard"
              :class="copied ? 'btn-copied' : ''"
              aria-label="Copy code snippet"
              @click="copySnippet"
              @blur="resetCopied"
              @mouseleave="resetCopied"
            >
              {{ copied ? "Copied!" : "Copy" }}
            </button>
            <pre>{{ codeSnippet }}</pre>
          </div>
        </CModalBody>
      </CModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import useCodeSnippet from "~/composables/useCodeSnippet";
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const modalVisible = ref(false);
const copied = ref(false);

defineExpose({ modalVisible });

const everyScenarioHasParameters = computed(() => props.scenarios.every(scenario => !!scenario.parameters));

const { codeSnippet } = useCodeSnippet(() => props.scenarios, everyScenarioHasParameters);

const copySnippet = () => {
  if (codeSnippet.value) {
    navigator.clipboard.writeText(codeSnippet.value);
    copied.value = true;
  };
};

const resetCopied = () => {
  // Add a little timeout so text is readable on immediate unhover
  setTimeout(() => {
    copied.value = false;
  }, 1500);
};
</script>

<style lang="scss" scoped>
:deep(.modal-dialog) {
  max-width: 40rem;}

.multi-scenario {
  :deep(.modal-dialog) {
    max-width: 50rem;
  }
}

.code {
  background-color: var(--cui-tertiary-bg);
  position: relative;
  max-height: 30rem;
}

.btn-clipboard {
    position: sticky;
    top: 0;
    right: 0;
    float: right;
    font-size: 0.8rem;
    border-radius: 0.25rem;
    padding: 0.25rem;
  &:hover {
    color: var(--cui-light);
    background-color: var(--cui-primary);
  }
}

.btn-copied {
  background-color: var(--cui-secondary-bg-dark)!important;
  color: var(--cui-light)!important;
}
</style>
