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
        <div class="code p-3">
          <pre>daedalus::daedalus(
  "{{ parameters!.country }}",
  "{{ parameters!.pathogen }}",
  response_strategy = "{{ parameters!.response }}",
  response_threshold = {{ parameters!.hospital_capacity }},
  vaccine_investment = "{{ parameters!.vaccine }}"
)</pre>
        </div>
      </CModalBody>
    </CModal>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();

const modalVisible = ref(false);

const parameters = computed(() => appStore.currentScenario.parameters);
</script>

<style lang="scss" scoped>
  .code {
    background-color: var(--cui-tertiary-bg);
  }
</style>
