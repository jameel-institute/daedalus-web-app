<script setup>
import '~/assets/scss/fonts.scss'
import { iconsSet } from '@/assets/icons'

const nuxtApp = useNuxtApp()
nuxtApp.vueApp.provide('icons', iconsSet)
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss">
@use "~/assets/scss/main.scss";
</style>
