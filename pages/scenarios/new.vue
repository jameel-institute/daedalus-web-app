<template>
  <div>
    <div :class="`overlay ${appStore.largeScreen ? 'large-screen' : ''}`">
      <h3>Simulate a new scenario</h3>
      <p>
        Select the parameters for your next scenario.
      </p>
      <ParameterForm :in-modal="false" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const appStore = useAppStore();

onMounted(() => {
  appStore.globe.interactive = false;
});
</script>

<style lang="scss" scoped>
.overlay {
  z-index: 1;
  position: relative;
  padding: 1rem;
  max-width: 30rem;
}

.overlay::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.5rem;
  background-color: rgba(red($cui-tertiary-bg), green($cui-tertiary-bg), blue($cui-tertiary-bg), 0.8);
  mix-blend-mode: color-burn;
  pointer-events: none;
}

.overlay.large-screen::before {
  box-shadow: var(--cui-box-shadow);
}
</style>
