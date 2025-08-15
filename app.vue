<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import Highcharts from "highcharts/esm/highcharts";
import { iconsSet } from "@/assets/icons";
import "~/assets/scss/fonts.scss";
import "flag-icons";

const nuxtApp = useNuxtApp();
nuxtApp.vueApp.provide("icons", iconsSet);

useHead({
  title: "DAEDALUS Explore",
});

// Fixes z-index issue:
// https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#html
Highcharts.HTMLElement.useForeignObject = true;

/**
 * Here, we use Highcharts' 'wrap' utility to make the onContainerMouseLeave method of the Pointer class
 * ignore onContainerMouseLeave events for charts that are synchronized, which appears
 * to be necessary to prevent tooltips and crosshairs from disappearing when the mouse moves *within* a chart,
 * not (as might be expected) when it leaves the chart container.
 * That seems to be a side-effect of the TimeSeries component calling point.onMouseOver().
 */
Highcharts.wrap(
  Highcharts.Pointer.prototype,
  "onContainerMouseLeave",
  function (this: Highcharts.Pointer, proceed, ...args) {
    if (!this.chart.series[0].options.custom?.synchronized) {
      proceed.apply(this, args);
    }
  },
);
</script>

<style lang="scss">
@use "~/assets/scss/main.scss";
</style>
