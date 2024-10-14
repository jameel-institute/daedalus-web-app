<template>
  <div v-show="appStore.currentScenario.parameters && appStore.currentScenario.result.data" class="d-inline-block ms-auto">
    <CTooltip content="Download as Excel file" placement="top">
      <template #toggler="{ togglerId, on }">
        <CButton
          id="btn-download-excel"
          color="light"
          :aria-describedby="togglerId"
          class="btn-download float-end"
          :disabled="appStore.downloading"
          v-on="on"
          @click="appStore.downloadExcel()"
        >
          <CIcon icon="cilCloudDownload" size="lg" class="text-secondary" />
        </CButton>
      </template>
    </CTooltip>
    <CAlert :visible="!!appStore.downloadError && !alertDismissed" class="download-error" color="danger">
      <CButton class="btn btn-close float-end" aria-label="Close" @click="alertDismissed = true" />
      <div>Download error: {{ appStore.downloadError }}</div>
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
.btn-download {
  padding-bottom: 0;
  height: 2.6rem;
  border: 1px solid rgba(8, 10, 12, 0.17); // copying from card
  border-radius: 0.375rem; // copying from card

  &:not(:hover) {
    background: $light-background;
  }
}

.download-error {
  margin-top: 3rem;
}
</style>
