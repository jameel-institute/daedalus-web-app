<template>
  <div>
    <p>
      Number of scenarios in the database when this page was rendered: {{ scenarios?.count }}
    </p>
  </div>
</template>

<script lang="ts" setup>
// https://nuxt.com/docs/getting-started/data-fetching
const { data: scenarios } = useFetch("/api/scenarios");
</script>

<style lang="scss" scoped>
</style>
