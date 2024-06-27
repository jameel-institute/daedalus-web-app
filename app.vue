<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { iconsSet } from '@/assets/icons';

const nuxtApp = useNuxtApp()
nuxtApp.vueApp.provide('icons', iconsSet);
</script>