<template>
  <span v-if="iconDetails" class="form-icon">
    <CIconSvg v-if="iconDetails.custom" class="icon parameter-icon">
      <img :src="customIconPath()">
    </CIconSvg>
    <CIcon v-else :icon="iconDetails.icon" class="parameter-icon text-secondary" />
  </span>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { Parameter } from "@/types/parameterTypes";

const props = defineProps<{
  parameter: Parameter
}>();

const iconDetails = computed((): { icon: string, custom: boolean } | undefined => {
  switch (props.parameter.id) {
    case "country":
      return { icon: "carbonSEEarth", custom: true }; // License is detailed here https://www.svgrepo.com/svg/340244/earth-southeast-asia
    case "response":
      return { icon: "cilShieldAlt", custom: false };
    case "vaccine":
      return { icon: "vectopusVaccine", custom: true }; // I heavily adapted this svg. License is detailed at https://www.svgrepo.com/svg/455593/vaccine
    case "pathogen":
      return { icon: "pictogrammersMaterialBacteria", custom: true }; // License is detailed here: https://www.iconarchive.com/show/material-icons-by-pictogrammers/bacteria-outline-icon.html
    case "hospital_capacity":
      return { icon: "cilMedicalCross", custom: false };
    default:
      return undefined;
  }
});

const customIconPath = () => {
  if (!iconDetails.value || !iconDetails.value.custom) {
    return "";
  }
  // The icon svg is exceptionally stored in /public to facilitate a simple way of having a dynamic img src attribute:
  // https://www.lichter.io/articles/nuxt3-vue3-dynamic-images/#the-public-folder-strategy
  // Bear in mind that this means the image will be cached by the browser, so to update the image, you must also change
  // the file name.
  return `/icons/${iconDetails.value.icon}.svg`;
};
</script>

<style lang="scss">
.field-container {
  .parameter-icon {
    margin-left: 0.75rem;
    margin-right: 0.5rem;
    padding: 0;
  }

  .button-group-container .parameter-icon {
    margin-left: 1.5rem;
  }
}
</style>
