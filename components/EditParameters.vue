<template>
  <CModal
    :visible="modalVisible"
    aria-labelledby="modalTitle"
    @close="() => { modalVisible = false }"
  >
    <CModalHeader>
      <CModalTitle id="modalTitle">
        Edit parameters
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <ParameterForm :in-modal="true" />
    </CModalBody>
  </CModal>
  <CTooltip
    content="Edit parameters"
    placement="top"
  >
    <template #toggler="{ togglerId, on }">
      <span
        role="button"
        :aria-describedby="togglerId"
        @click="() => { modalVisible = true }"
        v-on="on"
      >
        <CButton color="light" class="parameters-button">
          Parameters
        </CButton>
        <CIcon icon="cilPencil" class="form-icon link-secondary" />
      </span>
    </template>
  </CTooltip>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const modalVisible = ref(false);
</script>

<style lang="scss">
.parameters-button, .parameters-button:active {
  background: transparent !important;
  border: transparent !important;
}
</style>
