<template>
  <table v-if="appStore.totalCost" class="table rounded table-hover table-sm">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th style="cursor: pointer" @click="accordioned = !accordioned">
          <CIcon icon="cilPlus" />
          <span class="text-muted ps-1">{{ accordioned ? "Expand" : "Collapse" }} all</span>
        </th>
        <th>{{ isGdp ? `% of ${gdpReference} GDP` : "$, millions" }}</th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="(childCost) in appStore.totalCost.children"
        :key="childCost.id"
      >
        <tr>
          <td class="ps-2">
            {{ appStore.getCostLabel(childCost.id) }}<span v-if="childCost.id === 'life_years'">*</span>
          </td>
          <td>{{ displayValue(childCost.value) }}</td>
        </tr>
        <template v-if="childCost.children && !accordioned">
          <tr
            v-for="grandChildCost in childCost.children"
            :key="grandChildCost.id"
            class="nested-row fw-lighter"
          >
            <td class="ps-4">
              {{ appStore.getCostLabel(grandChildCost.id) }}
            </td>
            <td>{{ displayValue(grandChildCost.value) }}</td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import { gdpReference } from "./utils/formatters";

const props = defineProps<{
  isGdp: boolean
}>();

const accordioned = ref(true);
const appStore = useAppStore();

const displayValue = (valueInDollarTerms: number): string => {
  if (props.isGdp) {
    return `${((valueInDollarTerms / appStore.currentScenario.result.data!.gdp) * 100).toFixed(1)}%`;
  } else {
    return formatCurrency(valueInDollarTerms);
  }
};
</script>

<style scoped>
.nested-row {
  background-color: #f1f3f5;
}
td {
  padding-left: 0.5rem;
}
thead tr th {
  font-weight: 600 !important;
}
</style>
