<template>
  <div
    class="card-body p-0"
  >
    <TimeSeries
      v-for="(_, seriesId, index) in appStore.timeSeriesData"
      :key="seriesId"
      :series-id="seriesId"
      :index="index"
      :open="openedAccordions.includes(seriesId)"
      :hide-tooltips="hideTooltips"
      :container-height-px="containerHeightPx"
      :chart-height-px="chartHeightPx"
      :min-chart-height-px="minChartHeightPx"
      @toggle-open="toggleOpen(seriesId)"
      @hide-all-tooltips="hideAllTooltips"
      @show-all-tooltips="showAllTooltips"
    />
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const openedAccordions = ref<string[]>([]);
const hideTooltips = ref(false);
const accordionBodyYPadding = 8;
const minAccordionHeight = 150;
const minTotalAccordionHeight = 500;
const minChartHeightPx = minAccordionHeight - (2 * accordionBodyYPadding);
const maxTotalAccordionHeight = computed(() => {
  if (appStore.timeSeriesData) { // Allow at least minAccordionHeight for each accordion
    return Math.max(minTotalAccordionHeight, (Object.keys(appStore.timeSeriesData!).length * minAccordionHeight));
  } else {
    return minTotalAccordionHeight;
  }
});

// Share available height equally between open accordions. Avoid division by zero.
const containerHeightPx = computed(() => openedAccordions.value.length ? (maxTotalAccordionHeight.value / openedAccordions.value.length) : 1);
const chartHeightPx = computed(() => containerHeightPx.value - (2 * accordionBodyYPadding));

const initializeAccordions = () => {
  openedAccordions.value = Object.keys(appStore.timeSeriesData || {});
};

const showAllTooltips = () => {
  hideTooltips.value = false;
};

const hideAllTooltips = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};

const toggleOpen = (seriesId: string) => {
  hideAllTooltips();
  if (openedAccordions.value.includes(seriesId)) {
    openedAccordions.value = openedAccordions.value.filter(id => id !== seriesId);
  } else {
    openedAccordions.value = [...openedAccordions.value, seriesId];
  }
};

onMounted(() => {
  initializeAccordions();
});

watch(() => (Object.keys(appStore.timeSeriesData || {})), () => {
  initializeAccordions();
});
</script>

<style scoped lang="scss">
</style>
