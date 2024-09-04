<template>
  <div>
    <p>
      Query parameter: {{ route.params.id }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
</script>

<style lang="scss" scoped>

</style>
