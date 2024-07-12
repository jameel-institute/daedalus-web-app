<script setup lang="ts">
const sidebarVisible = ref(false)

function handleToggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

function handleSidebarHidden() {
  // The 'hide' event is emitted by the CoreUI Sidebar component as a callback whenever the sidebar
  // is closed, whether by clicking a button or (on mobile) clicking outside the sidebar, and we
  // bubble it up to this layout component so that our 'sidebarVisible' ref is updated correspondingly.
  sidebarVisible.value = false
}
</script>

<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar
      :visible="sidebarVisible"
      @toggle="handleToggleSidebar"
      @hidden="handleSidebarHidden"
    />
    <AppHeader
      @toggle-sidebar="handleToggleSidebar"
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
