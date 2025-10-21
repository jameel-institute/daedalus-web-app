<template>
  <CRow class="mx-2">
    <div
      class="col-12 d-flex flex-column"
      :class="{ 'col-xl-6': allowVerticalSplit }"
    >
      <CFormSwitch
        id="costsChartDiffSwitch"
        v-model="diffCostsChart"
        label="Display as difference from baseline"
        class="mb-3"
      />
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler :scenarios="appStore.currentComparison.scenarios" />
        <CompareCostsLegend />
      </div>
      <CompareCostsChart :diffing="diffCostsChart" />
    </div>
    <div
      class="col-12 d-flex flex-column"
      :class="{ 'col-xl-6': allowVerticalSplit }"
    >
      <CostsTable
        :scenarios="appStore.currentComparison.scenarios"
        :diffing="diffCostsChart"
        class="w-full mt-5"
      />
    </div>
  </CRow>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const diffCostsChart = ref(false);

const allowVerticalSplit = computed(() => appStore.currentComparison.scenarios.length < 5);
</script>
