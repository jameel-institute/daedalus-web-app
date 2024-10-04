<template>
  <div
    class="card-body p-0"
    @mouseleave="handleMouseLeave"
    @mouseover="() => { hideTimeSeriesTooltips = false }"
  >
    <TimeSeries
      v-for="(_, seriesId, index) in appStore.timeSeriesData"
      :key="seriesId"
      :series-id="seriesId"
      :index="index"
      :opened-accordions="openedTimeSeriesAccordions"
      :hide-tooltips="hideTimeSeriesTooltips"
      @toggle-open="toggleOpen(seriesId)"
    />
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const openedTimeSeriesAccordions = ref<string[]>([]);
const hideTimeSeriesTooltips = ref(false);

const toggleOpen = (seriesId: string) => {
  if (openedTimeSeriesAccordions.value.includes(seriesId)) {
    openedTimeSeriesAccordions.value = openedTimeSeriesAccordions.value.filter(id => id !== seriesId);
  } else {
    openedTimeSeriesAccordions.value = [...openedTimeSeriesAccordions.value, seriesId];
  }
};

const handleMouseLeave = () => {
  setTimeout(() => {
    hideTimeSeriesTooltips.value = true;
  }, 500);
};

onMounted(() => {
  openedTimeSeriesAccordions.value = Object.keys(appStore.timeSeriesData || {});
});

watch(() => (Object.keys(appStore.timeSeriesData || {})), (seriesIds) => {
  openedTimeSeriesAccordions.value = seriesIds;
});
</script>

<style scoped lang="scss">
</style>
