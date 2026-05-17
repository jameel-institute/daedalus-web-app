<template>
  <div>
    <div v-if="appStore.preferences">
      <CFormSwitch
        id="costMetricSwitch"
        v-model="metricIsLifeYears"
        label="Show life years lost only"
        @update:model-value="handleUpdate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const appStore = useAppStore();

// Just to initialize, not the source of truth
const metricIsLifeYears = ref(appStore.preferences.costMetric === LIFE_YEARS_METRIC);

const handleUpdate = (newValue: boolean) => {
  appStore.preferences.costMetric = newValue ? LIFE_YEARS_METRIC : USD_METRIC;
};
</script>
