<template>
  <div>
    <!-- <WebsocketConnection /> -->
    <SideBar/>
    <AppHeader />
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
</script>

<style lang="scss">
.wrapper {
  min-height: $min-wrapper-height;
}
</style>