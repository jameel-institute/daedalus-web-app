<script setup lang="ts">
const sidebarVisible = ref(false)
const sidebarUnfoldable = ref(false)
const hideHasBeenEmitted = ref(false)

// To be called on smaller screens
function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value
}

// To be called on larger screens
function handleToggleSidebarWidth() {
  if (sidebarUnfoldable.value) {
    sidebarUnfoldable.value = false
  }
  else {
    sidebarUnfoldable.value = true
  }
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
    sidebarUnfoldable.value = false
  }
  else {
    sidebarVisible.value = true
    sidebarUnfoldable.value = true
  }
}
</script>

<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar
      :visible="sidebarVisible"
      :unfoldable="sidebarUnfoldable"
      @hidden="handleSidebarHidden"
    />
    <AppHeader
      @toggle-sidebar-visibility="handleToggleSidebarVisibility"
      @toggle-sidebar-width="handleToggleSidebarWidth"
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

<style lang="scss">
@use "sass:map";

.wrapper {
  min-height: $min-wrapper-height;
}

.sidebar {
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    margin-top: $app-header-height;
  }
}
</style>
