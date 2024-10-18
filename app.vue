<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { iconsSet } from "@/assets/icons";
import "~/assets/scss/fonts.scss";

const nuxtApp = useNuxtApp();
nuxtApp.vueApp.provide("icons", iconsSet);

useHead({
  title: "DAEDALUS Explore",
});
</script>

<style lang="scss">
@use "~/assets/scss/main.scss";
</style>
