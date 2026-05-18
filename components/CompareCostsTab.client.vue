<template>
  <CRow class="mx-2">
    <div
      class="col-12 d-flex flex-column"
      :class="{ 'col-xl-6': allowVerticalSplit }"
    >
      <div class="d-flex column-gap-4 flex-wrap">
        <CFormSwitch
          id="costsChartDiffSwitch"
          v-model="diffCosts"
          label="Display as difference from the comparison baseline"
          class="mb-3"
        />
        <CFormSwitch
          id="costMetricSwitch"
          v-model="showLifeYearsMetric"
          label="Show life years lost"
        />
      </div>
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler :scenarios="appStore.currentComparison.scenarios" />
        <CompareCostsLegend />
      </div>
      <CompareCostsChart :diffing="diffCosts" :chart-height-px="showLifeYearsMetric ? 300 : 500" />
      <div class="d-flex">
        <CompareLifeYearsLegend v-if="showLifeYearsMetric" class="m-2 ms-auto" />
      </div>
      <CompareLifeYearsCostsChart v-if="showLifeYearsMetric" :diffing="diffCosts" :chart-height-px="300" />
    </div>
    <div
      class="col-12 d-flex flex-column"
      :class="{ 'col-xl-6': allowVerticalSplit }"
    >
      <CostsTable
        :scenarios="appStore.currentComparison.scenarios"
        :diffing="diffCosts"
        class="w-full mt-5"
      />
    </div>
  </CRow>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const diffCosts = ref(true);

const showLifeYearsMetric = ref(false);

const allowVerticalSplit = computed(() => appStore.currentComparison.scenarios.length < 5);
</script>
