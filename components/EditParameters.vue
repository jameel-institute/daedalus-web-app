<template>
  <Teleport to="body">
    <CModal
      :visible="modalVisible"
      aria-labelledby="editParamsModalTitle"
      @close="() => { modalVisible = false }"
    >
      <CModalHeader>
        <CModalTitle id="editParamsModalTitle">
          Change parameters
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <ParameterForm :in-modal="true" />
      </CModalBody>
    </CModal>
  </Teleport>
  <CButton color="secondary" class="parameters-button btn-scenario-header" @click="() => { modalVisible = true }">
    Change parameters
    <CIcon icon="cilPencil" class="ms-1" />
  </CButton>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const modalVisible = ref(false);
</script>

<style lang="scss" scoped>
.parameters-button {
  border-radius: 5px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-width: 0;
  height: 100%;
}
</style>
