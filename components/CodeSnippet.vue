<template>
  <div class="d-inline-block">
    <div v-if="parameters">
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
            Use this R code snippet to run the model directly with the daedalus package for the current parameters.
            See the <NuxtLink to="https://jameel-institute.github.io/daedalus/" target="_blank">
              daedalus documentation
            </NuxtLink>
            for installation instructions and further details.
          </p>
          <div class="code p-3">
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

const appStore = useAppStore();

const modalVisible = ref(false);
const copied = ref(false);

const parameters = computed(() => appStore.currentScenario.parameters);
const codeSnippet = computed(() => {
  return `model_result <- daedalus::daedalus(
  "${parameters.value?.country}",
  "${parameters.value?.pathogen}",
  response_strategy = "${parameters.value?.response}",
  response_threshold = ${parameters.value?.hospital_capacity},
  vaccine_investment = "${parameters.value?.vaccine}"
)`;
});

const copySnippet = () => {
  navigator.clipboard.writeText(codeSnippet.value);
  copied.value = true;
};

const resetCopied = () => {
  // Add a little timeout so text is readable on immediate unhover
  setTimeout(() => {
    copied.value = false;
  }, 1500);
};
</script>

<style lang="scss" scoped>
  .code {
    background-color: var(--cui-tertiary-bg);
    position: relative;
  }

  .btn-clipboard {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
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
