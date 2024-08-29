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
  </div>
</template>

<script setup lang="ts">
const sidebarVisible = ref(false);

function handleToggleSidebarVisibility() {
  sidebarVisible.value = !sidebarVisible.value;
}
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
