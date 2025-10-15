<template>
  <CRow class="mx-2">
    <div class="col-12 col-xl-6 d-flex flex-column">
      <div class="d-flex align-items-start justify-content-between">
        <CostBasisToggler :scenarios="appStore.currentComparison.scenarios" />
        <div class="d-flex flex-column">
          <CFormSwitch
            id="stackCostsChartSwitch"
            v-model="stackCosts"
            label="Stack top-level costs"
            @change="() => { if (!stackCosts) allowGrandchildCosts = false }"
          />
          <CFormSwitch
            id="allowGrandchildCostsSwitch"
            v-model="allowGrandchildCosts"
            :disabled="stackCosts"
            label="Show sub-costs"
          />
        </div>
        <CompareCostsLegend />
      </div>
      <CompareCostsChart
        :stacked="stackCosts"
        :allow-grandchild-costs="allowGrandchildCosts"
      />
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
const allowGrandchildCosts = ref(false);
</script>
