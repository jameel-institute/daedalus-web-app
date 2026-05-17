<template>
  <div>
    <div v-if="appStore.preferences">
      <CFormSwitch
        id="costMetricSwitch"
        v-model="showLifeYearsMetric"
        label="Show loss of life in life years"
        @update:model-value="handleUpdate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const appStore = useAppStore();

const showLifeYearsMetric = ref(false);
</script>
