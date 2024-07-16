<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar
      :visible="sidebarVisible"
      :large-screen="largeScreen"
      @hidden="handleSidebarHidden"
    />
    <AppHeader
      @toggle-sidebar-visibility="handleToggleSidebarVisibility"
    />
    <div class="wrapper d-flex flex-column">
      <div class="body flex-grow-1">
        <CContainer xxl class="px-4">
          <slot />
        </CContainer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarVisible = ref(false)
const largeScreen = ref(false)
const hideHasBeenEmitted = ref(false)

function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value
}

function handleSidebarHidden() {
  if (hideHasBeenEmitted.value) {
    // If this is not the 'hide' emitted on page load, we obey it.
    sidebarVisible.value = false
  }
  else {
    // If this is the 'hide' emitted on page load, we un-do it.
    // This is because the CoreUI Sidebar component emits a 'hide' event on page load, which we
    // don't want to obey for larger screen sizes.
    sidebarVisible.value = true
    resetSidebarPerScreenSize()
    hideHasBeenEmitted.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', () => {
    resetSidebarPerScreenSize()
  })
})

const breakpoint = 992 // CoreUI's "lg" breakpoint
function resetSidebarPerScreenSize() {
  // Set the default values for the sidebar based on the screen size.
  if (window.innerWidth < breakpoint) {
    sidebarVisible.value = false
    largeScreen.value = false
  }
  else {
    sidebarVisible.value = true
    largeScreen.value = true
  }
}
</script>

<style lang="scss">
@use "sass:map";

$sidebar-narrow-width: 4rem;
.body {
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    padding-left: $sidebar-narrow-width;
  }
}

.wrapper {
  min-height: $min-wrapper-height;
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
