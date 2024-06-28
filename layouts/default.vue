<script setup lang="ts">
    import '@coreui/coreui/dist/css/coreui.min.css';
</script>

<template>
  <div>
    <AppHeader />
    <WebsocketConnection />
    <slot />
  </div>
</template>