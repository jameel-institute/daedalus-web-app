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

<script setup lang="ts">
const { sidebarVisible, handleToggleSidebar, handleSidebarHidden } = useSidebar();
</script>

<style lang="scss">
.wrapper {
  min-height: $min-wrapper-height;
}
</style>