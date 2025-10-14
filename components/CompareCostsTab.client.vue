<template>
  <CRow class="mx-2">
    <div class="col-12 col-xl-6 d-flex flex-column">
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler :scenarios="appStore.currentComparison.scenarios" />
        <CFormSwitch
          id="stackCostsChartSwitch"
          v-model="stackCosts"
          label="Stack costs"
        />
        <CompareCostsLegend />
      </div>
      <CompareCostsChart :stacked="stackCosts" />
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

const stackCosts = ref(true);
</script>
