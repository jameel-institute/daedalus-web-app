<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar
      v-model:visible="sidebarVisible"
      :version-tooltip-content="versionTooltipContent"
    />
    <AppHeader
      :version-tooltip-content="versionTooltipContent"
      @toggle-sidebar-visibility="handleToggleSidebarVisibility"
    />
    <div class="wrapper d-flex flex-column">
      <div class="body flex-grow-1">
        <CContainer xxl>
          <slot />
        </CContainer>
      </div>
    </div>
    <!-- <Globe /> -->
  </div>
</template>

<script setup lang="ts">
const sidebarVisible = ref(false);

function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value;
}

const appStore = useAppStore();

const versionTooltipContent = computed(() => {
  const vers = appStore.versions;
  if (vers) {
    return `Model version: ${vers.daedalusModel} \nR API version: ${vers.daedalusApi} \nWeb app version: ${vers.daedalusWebApp}`;
  } else {
    return undefined;
  }
});

const setScreenSize = () => {
  const breakpoint = 992; // CoreUI's "lg" breakpoint
  if (window.innerWidth < breakpoint) {
    appStore.largeScreen = false;
  } else {
    appStore.largeScreen = true;
  }
};

appStore.loadMetadata();

onMounted(() => {
  setScreenSize();
  appStore.loadVersionData();
  window.addEventListener("resize", setScreenSize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", setScreenSize);
});
</script>

<style lang="scss">
@use "sass:map";
.body {
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    padding-left: $sidebar-narrow-width;
  }
}

.wrapper {
  min-height: $min-wrapper-height;

  .container-xxl {
    padding-left: $container-padding !important;
    padding-right: $container-padding !important;
    max-width: unset;
  }
}

.sidebar { // .sidebar selector does not work if placed in the Sidebar component
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    margin-top: $app-header-height;

    &:not(:hover) .sidebar-header {
      display: none !important;
    }
  }

  &.sidebar-overlaid.show {
    box-shadow: none;
  }
}
</style>
