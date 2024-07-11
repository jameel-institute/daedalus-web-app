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

<script lang="ts" setup>
import { useRoute } from 'vue-router'
const route = useRoute()

const items = route.meta.breadcrumbs || []
</script>

<style lang="scss" scoped>
</style>