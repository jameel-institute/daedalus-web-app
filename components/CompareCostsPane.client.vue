<template>
  <CRow class="mx-2">
    <div class="d-flex d-xl-none align-items-start justify-content-between">
      <CostBasisToggler />
      <CompareCostsLegend />
    </div>
    <CompareCostsChart class="col-12 col-xl-6" />
    <div class="col-12 col-xl-6 d-flex flex-column">
      <div class="d-none d-xl-flex align-items-start justify-content-start gap-4">
        <CompareCostsLegend />
        <CostBasisToggler />
      </div>
      <CostsTable
        :scenarios="appStore.currentComparison.scenarios"
        class="w-full mt-3"
      />
    </div>
  </CRow>
</template>

<script setup lang="ts">
const appStore = useAppStore();
</script>
