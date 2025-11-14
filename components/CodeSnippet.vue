<template>
  <div class="d-inline-block">
    <div v-if="codeSnippet">
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
            See the
            <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
            <NuxtLink to="https://jameel-institute.github.io/daedalus/" target="_blank">daedalus documentation</NuxtLink> for
            installation instructions and further details.
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
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenarios: Scenario[]
}>();

const modalVisible = ref(false);
const copied = ref(false);

defineExpose({ modalVisible });

// In the future, we should have the R API capture the actual call made to the model,
// returning it as part of the result response, so that it can be displayed here verbatim.
// In that way, we'd avoid two things:
// (1) replicating logic or constants from the R API package here,
// (2) the risk of the code snippet being out of date with respect to the current model.

const codeSnippet = computed(() => {
  if (!props.scenarios.every(scenario => !!scenario.parameters)) {
    return;
  }
  return props.scenarios.map(({ parameters }) => ``
    + `country_obj <- daedalus::daedalus_country("${parameters!.country}")\n`
    + `country_obj$hospital_capacity <- ${parameters!.hospital_capacity}\n`
    + `\n`
    + `model_result <- daedalus::daedalus(\n`
    + `  country_obj,\n`
    + `  "${parameters!.pathogen}",\n`
    + `  response_strategy = "${parameters!.response}",\n`
    + `  vaccine_investment = "${parameters!.vaccine}"\n`
    + `)`,
  ).join("\n\n");
});

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
