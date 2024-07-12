<!-- This code is not complete. It's an example of how breadcrumbs could work.
I expect that to change based on how we end up making routes work. -->

<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const items = route.meta.breadcrumbs || []
</script>

<template>
  <CBreadcrumb class="my-0">
    <CBreadcrumbItem
      v-for="(item, index) in items"
      :key="item.text"
      :href="item.href"
      :class="index === items.length - 1 ? 'active' : ''"
    >
      {{ item.text }}
    </CBreadcrumbItem>
  </CBreadcrumb>
</template>

<style lang="scss" scoped>
</style>
