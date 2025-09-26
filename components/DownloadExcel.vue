<template>
  <div class="d-inline-block">
    <div v-if="showButton">
      <CTooltip content="Download as Excel file" placement="top">
        <template #toggler="{ togglerId, on }">
          <CButton
            id="btn-download-excel"
            color="light"
            :aria-describedby="togglerId"
            class="btn-scenario-header"
            :disabled="appStore.downloading"
            v-on="on"
            @click="download"
          >
            <CIcon icon="cilCloudDownload" size="lg" class="text-muted" />
          </CButton>
        </template>
      </CTooltip>
      <CAlert :visible="!!appStore.downloadError && !alertDismissed" class="download-error" color="danger">
        <CButton class="btn btn-close float-end" aria-label="Close" @click="alertDismissed = true" />
        <div>Download error: {{ appStore.downloadError }}</div>
      </CAlert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";

const props = defineProps<{
  comparison: boolean
}>();

const appStore = useAppStore();

const showButton = computed(() => props.comparison ? appStore.everyScenarioHasRunSuccessfully : (appStore.currentScenario.parameters && appStore.currentScenario.result.data));

const download = () => {
  appStore.downloadExcel(props.comparison);
};

// We want to undismiss on new download, so can't use default dismissed prop
const alertDismissed = ref(false);

watch(() => appStore.downloading, () => {
  alertDismissed.value = false;
});
</script>

<style lang="scss" scoped>
.download-error {
  margin-top: 3rem;
}
</style>
