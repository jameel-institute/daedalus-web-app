<template>
  <table v-if="appStore.totalCost?.children" class="table rounded table-hover table-sm" aria-label="Costs table">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th>
          <CButton
            v-if="appStore.totalCost.children.length > 0"
            class="btn p-0 text-decoration-none text-muted"
            color="link"
            :aria-expanded="accordioned"
            :aria-label="accordioned ? 'Expand costs table' : 'Collapse costs table'"
            aria-controls="costs-table-body"
            @click="() => { accordioned = !accordioned; }"
          >
            <CIcon :icon="accordioned ? 'cilPlus' : 'cilMinus'" />
            <span class="ps-1">{{ accordioned ? "Expand" : "Collapse" }} all</span>
          </CButton>
        </th>
        <th>{{ appStore.preferences.costBasis === CostBasis.PercentGDP ? `% of ${gdpReferenceYear} GDP` : "$, millions" }}</th>
      </tr>
    </thead>
    <tbody id="costs-table-body">
      <template
        v-for="(childCost) in appStore.totalCost.children"
        :key="childCost.id"
      >
        <tr>
          <td class="ps-2 w-75">
            {{ appStore.getCostLabel(childCost.id) }}<span v-if="childCost.id === 'life_years'">*</span>
          </td>
          <td>{{ displayValue(childCost.value) }}</td>
        </tr>
        <tr
          v-for="grandChildCost in childCost.children"
          v-show="!accordioned"
          :key="grandChildCost.id"
          class="nested-row fw-lighter"
        >
          <td class="ps-4">
            {{ appStore.getCostLabel(grandChildCost.id) }}
          </td>
          <td>{{ displayValue(grandChildCost.value) }}</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import { costAsPercentOfGdp, gdpReferenceYear, humanReadablePercentOfGdp } from "./utils/formatters";
import { CostBasis } from "~/types/unitTypes";

const accordioned = ref(true);
const appStore = useAppStore();

const displayValue = (valueInDollarTerms: number): string => {
  switch (appStore.preferences.costBasis) {
    case CostBasis.PercentGDP:
    {
      const percentOfGdp = costAsPercentOfGdp(valueInDollarTerms, appStore.currentScenario.result.data?.gdp);
      return `${humanReadablePercentOfGdp(percentOfGdp).percent}%`;
    }
    case CostBasis.USD:
    {
      return valueInDollarTerms > 10_000
        ? (Math.round(valueInDollarTerms / 1000) * 1000).toLocaleString()
        : new Intl.NumberFormat("en-US", {
            maximumSignificantDigits: 1,
          }).format(valueInDollarTerms);
    }
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
