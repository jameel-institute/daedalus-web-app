<template>
  <div>
    <CFormLabel>Show losses:</CFormLabel>
    <div v-if="appStore.preferences">
      <CFormCheck
        id="costBasisGdp"
        v-model="appStore.preferences.costBasis"
        :inline="true"
        type="radio"
        :label="`as % of ${gdpReferenceYear} GDP`"
        :value="CostBasis.PercentGDP"
      />
      <CFormCheck
        id="costBasisUsd"
        v-model="appStore.preferences.costBasis"
        :inline="true"
        type="radio"
        label="in USD"
        :value="CostBasis.USD"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CostBasis } from "~/types/unitTypes";
import { gdpReferenceYear } from "@/components/utils/formatters";

const appStore = useAppStore();
</script>
