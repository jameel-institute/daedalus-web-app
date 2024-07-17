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
        <CContainer xxl class="px-4">
          <slot />
        </CContainer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarVisible = ref(false)

function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value
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
