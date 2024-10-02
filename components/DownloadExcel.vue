<template>
  <div v-show="appStore.currentScenario.parameters" class="d-inline-block ms-2 align-content-center">
    <CSpinner v-if="appStore.downloading" size="sm" class="ms-2" />
    <CTooltip v-else content="Download as Excel file" placement="top">
      <template #toggler="{ togglerId, on }">
        <CButton color="light" :aria-describedby="togglerId" v-on="on" @click="appStore.downloadExcel()">
          <CIcon icon="cilCloudDownload" size="lg" />
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
