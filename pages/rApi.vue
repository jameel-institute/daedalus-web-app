<template>
  <div>
    API response:
    {{ data }}
  </div>
</template>

<script lang="ts" setup>
// https://nuxt.com/docs/getting-started/data-fetching
const { data } = await useFetch("/api/r", {
  method: 'get',
  body: {
    rApiEndpoint: '/',
    rApiQueryParams: '',
  }
});
</script>

<style>

</style>
