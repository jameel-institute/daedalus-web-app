<template>
  <div>
    <h1>{{ t('comparisons.index.heading', { parameter: t('parameters.policy') }) }}</h1>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

// A non-dynamic placeholder example of what the breadcrumb text would be.
// The text should actually depend on the route (which determines which axis is the axis of comparison).
definePageMeta({
  breadcrumbs: [
    { text: "Base scenario", href: "#" },
    { text: "Explore more scenarios", href: "#" },
    { text: `By policy response` },
  ],
});
</script>

<style lang="scss" scoped>

</style>
