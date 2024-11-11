<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar
      v-model:visible="sidebarVisible"
    />
    <AppHeader
      @toggle-sidebar-visibility="handleToggleSidebarVisibility"
    />
    <div class="wrapper d-flex flex-column">
      <div class="body flex-grow-1">
        <CContainer xxl>
          <slot />
        </CContainer>
      </div>
    </div>
    <!-- This is a dynamic import: https://nuxt.com/docs/guide/directory-structure/components#dynamic-imports -->
    <LazyGlobe v-if="loadGlobeComponent" />
  </div>
</template>

<script setup lang="ts">
const appStore = useAppStore();

const sidebarVisible = ref(false);
const loadGlobeComponent = ref(false);
const route = useRoute();

function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value;
}

const pagesUsingGlobe = ["scenarios-runId", "scenarios-new"];

// Set whether to load the globe component based on the current route and screen size
const setGlobeComponent = () => {
  // In order that we only load the globe component once, don't set loadGlobeComponent back to false if
  // it's already true, since setting it to false will cause the component to be destroyed.
  if (!loadGlobeComponent.value) {
    // Set the loadGlobeComponent value here, rather than using a computed property, since the app store initializes
    // with the assumption that largeScreen is true, and so it would always try to load the globe on the initial page load.
    loadGlobeComponent.value = appStore.largeScreen && pagesUsingGlobe.includes(route.name as string);
  }
};

const setScreenSize = () => {
  const breakpoint = 992; // CoreUI's "lg" breakpoint
  if (window.innerWidth < breakpoint) {
    appStore.largeScreen = false;
  } else {
    appStore.largeScreen = true;
  }
  setGlobeComponent();
};

watch(() => route.name, () => {
  setGlobeComponent();
});

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
