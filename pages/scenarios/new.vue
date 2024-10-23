<template>
  <div id="newScenarioPage">
    <div :class="`overlay z-1 position-relative conditional-transparency ${appStore.largeScreen ? 'large-screen' : ''}`">
      <h3>Simulate a new scenario</h3>
      <p>
        Select the parameters for your next scenario.
      </p>
      <ParameterForm :in-modal="false" />
    </div>
    <ReferenceLinks custom-classes="conditional-transparency new-page-reference-links z-1 position-relative pt-3 pb-2 ps-4" />
  </div>
</template>

<script lang="ts" setup>
const appStore = useAppStore();

onMounted(() => {
  appStore.globe.interactive = true;
  appStore.globe.tentativelySelectedCountry = null; // Reset the globe (not the form)
});
</script>

<style lang="scss" scoped>
@use "sass:color";

.overlay {
  padding: 1rem;
  max-width: 30rem;
  backdrop-filter: blur(1px);
}

.overlay::before {
  pointer-events: none;
  border-radius: 0.5rem;
}

.overlay.large-screen::before {
  box-shadow: var(--cui-box-shadow);
}

#newScenarioPage {
  height: $min-wrapper-height;
  display: flex;
  flex-direction: column;
}
</style>
