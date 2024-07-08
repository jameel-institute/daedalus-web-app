<script setup lang="ts">
  import '~/assets/scss/main.scss';
  import '~/assets/scss/fonts.scss';
</script>

<template>
  <div>
    <AppHeader />
    <SideBar />
    <WebsocketConnection />
    <slot />
  </div>
</template>