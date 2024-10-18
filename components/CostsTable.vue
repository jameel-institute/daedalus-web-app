<template>
  <table v-if="appStore.totalCost" class="table rounded table-hover table-sm">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th>Loss</th>
        <th>Total Millions</th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="childCost in appStore.totalCost.children"
        :key="childCost.id"
      >
        <tr class="nested-row">
          <td class="ps-4">
            {{ getCostLabel(childCost.id) }}
          </td>
          <td>{{ formatCurrency(childCost.value) }}</td>
        </tr>
        <template v-if="childCost.children">
          <tr
            v-for="grandChildCost in childCost.children"
            :key="grandChildCost.id"
            class="nested-row-2"
          >
            <td class="ps-5">
              {{ getCostLabel(grandChildCost.id) }}
            </td>
            <td>{{ formatCurrency(grandChildCost.value) }}</td>
          </tr>
        </template>
      </template>
      <tr>
        <td>
          <strong>{{ getCostLabel(appStore.totalCost.id) }}</strong>
        </td>
        <td>{{ formatCurrency(appStore.totalCost.value) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
const appStore = useAppStore();
const getCostLabel = (costId: string) => {
  const name = appStore.metadata?.results.costs.find(
    cost => cost.id === costId,
  )?.label;
  return name || costId;
};
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};
</script>

<style scoped lang="scss">
@use "sass:map";
.nested-row {
  background-color: #f8f9fa;
}
.nested-row-2 {
  background-color: #f1f3f5;
}
.card-body {
    display: flex;
    flex-direction: column;
  }
  .card-table-container {
    display: flex;
    justify-content: start;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .pie {
    width: 400px;
    height: 400px;
  }
</style>
