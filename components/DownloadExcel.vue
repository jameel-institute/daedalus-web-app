<template>
  <div v-show="appStore.currentScenario.parameters" class="d-inline-block ms-auto align-content-center">
    <CSpinner v-if="appStore.downloading" size="sm" class="ms-2" />
    <CTooltip v-else content="Download as Excel file" placement="top">
      <template #toggler="{ togglerId, on }">
        <CButton color="light" :aria-describedby="togglerId" v-on="on" @click="appStore.downloadExcel()">
          <CIcon icon="cilCloudDownload" size="lg" class="text-secondary" />
        </CButton>
      </template>
    </CTooltip>
    <CAlert :visible="!!appStore.downloadError && !alertDismissed" color="danger">
      Download error: {{ appStore.downloadError }}
      <CButton class="btn btn-close" @click="alertDismissed = true" />
    </CAlert>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();
// We want to undismiss on new download, so can't use default dismissed prop
const alertDismissed = ref(false);
watch(() => appStore.downloading, () => {
  alertDismissed.value = false;
});
</script>

<style lang="scss" scoped>
.btn {
  padding-bottom: 0;
  height: 100%;
  border: 1px solid rgba(8, 10, 12, 0.17); // copying from card
  border-radius: 0.375rem; // copying from card

  &:not(:hover) {
    background: rgba(255, 255, 255, 0.5);
  }
}
</style>
