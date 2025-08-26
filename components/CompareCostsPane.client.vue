<template>
  <CRow class="mx-2">
    <div class="col-12 col-xl-6 d-flex flex-column">
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler />
        <CompareCostsLegend />
      </div>
      <CompareCostsChart />
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
</script>
