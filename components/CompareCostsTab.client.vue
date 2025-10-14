<template>
  <CRow class="mx-2">
    <div class="col-12 col-xl-6 d-flex flex-column">
      <CFormSwitch
        id="costsChartDiffSwitch"
        v-model="diffCostsChart"
        label="Display differences relative to baseline scenario"
        class="mb-3"
      />
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler :scenarios="appStore.currentComparison.scenarios" />
        <CompareCostsLegend />
      </div>
      <CompareCostsChart :diffing="diffCostsChart" />
    </div>
    <div class="col-12 col-xl-6 d-flex flex-column">
      <CostsTable
        :scenarios="appStore.currentComparison.scenarios"
        class="w-full mt-5"
      />
    </div>
  </CRow>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const diffCostsChart = ref(false);
</script>
