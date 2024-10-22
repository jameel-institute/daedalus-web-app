<template>
  <div class="d-inline-block">
    <div v-if="parameters">
      <CTooltip content="Generate code snippet" placement="top">
        <template #toggler="{ togglerId, on }">
          <CButton
            id="btn-code-snippet"
            color="light"
            :aria-describedby="togglerId"
            class="btn-scenario-header"
            v-on="on"
            @click="() => { modalVisible = true; }"
          >
            <CIcon icon="cilCode" size="lg" class="text-secondary" />
          </CButton>
        </template>
      </CTooltip>
    </div>
    <CModal
      :visible="modalVisible"
      aria-labelledby="modalTitle"
      @close="() => { modalVisible = false }"
    >
      <CModalHeader>
        <CModalTitle id="modalTitle">
          Daedalus Code Snippet
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
            class="btn btn-clipboard btn-sm"
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
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();

const modalVisible = ref(false);
const copied = ref(false);

const parameters = computed(() => appStore.currentScenario.parameters);
const codeSnippet = computed(() => {
  return `daedalus::daedalus(
  "${parameters.value!.country}",
  "${parameters.value!.pathogen}",
  response_strategy = "${parameters.value!.response}",
  response_threshold = ${parameters.value!.hospital_capacity},
  vaccine_investment = "${parameters.value!.vaccine}"
)`;
});

const copySnippet = () => {
  navigator.clipboard.writeText(codeSnippet.value);
  copied.value = true;
};

const resetCopied = () => {
  copied.value = false;
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
      border-radius: 0.25rem;
    &:hover {
      color: var(--cui-light);
      background-color: var(--cui-primary);
    }
  }

  .btn-copied {
    background-color: var(--cui-secondary-bg-dark)!important;
  }
</style>
