<template>
  <table v-if="appStore.totalCost" class="table rounded table-hover table-sm">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th />
        <th>$, millions</th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="childCost in appStore.totalCost.children?.sort(
          (a, b) => b.value - a.value,
        )"
        :key="childCost.id"
      >
        <tr>
          <td>
            {{ appStore.getCostLabel(childCost.id) }}
          </td>
          <td>{{ formatCurrency(childCost.value) }}</td>
        </tr>
        <template v-if="childCost.children">
          <tr
            v-for="grandChildCost in childCost.children"
            :key="grandChildCost.id"
            class="nested-row fw-lighter"
          >
            <td class="ps-4">
              {{ appStore.getCostLabel(grandChildCost.id) }}
            </td>
            <td>{{ formatCurrency(grandChildCost.value) }}</td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
const appStore = useAppStore();
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
