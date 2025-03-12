<template>
  <table v-if="appStore.totalCost" class="table rounded">
    <thead class="border-bottom-2 border-black">
      <tr>
        <th>
          <CIcon icon="cilPlus" />
          <span class="text-muted ps-1">Expand all</span>
        </th>
        <th><CIcon icon="cil-star" class="me-1" /><b>None</b></th>
        <th><b>Low</b> (baseline)</th>
        <th><b>Medium</b></th>
        <th><b>High</b></th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="childCost in appStore.totalCost.children?.sort((a, b) => a.id.localeCompare(b.id))"
        :key="childCost.id"
      >
        <tr>
          <td class="ps-2 d-flex">
            {{ appStore.getCostLabel(childCost.id) }}
          </td>
          <td>{{ formatCurrency(childCost.value) }}</td>
          <td>{{ formatCurrency(childCost.value) }}</td>
          <td>{{ formatCurrency(childCost.value) }}</td>
          <td>{{ formatCurrency(childCost.value) }}</td>
        </tr>
        <template v-if="childCost.children">
          <tr
            v-for="grandChildCost in childCost.children"
            :key="grandChildCost.id"
            class="nested-row fw-lighter"
          >
            <td v-show="!accordioned" class="ps-4">
              {{ appStore.getCostLabel(grandChildCost.id) }}
            </td>
            <td v-show="!accordioned" >{{ formatCurrency(grandChildCost.value) }}</td>
            <td v-show="!accordioned" >{{ formatCurrency(grandChildCost.value) }}</td>
            <td v-show="!accordioned" >{{ formatCurrency(grandChildCost.value) }}</td>
            <td v-show="!accordioned" >{{ formatCurrency(grandChildCost.value) }}</td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();

const accordioned = ref(true);
</script>

<style scoped lang="scss">
.nested-row {
  background-color: #f1f3f5;
}
td {
  padding-left: 0.5rem;
}
thead tr {
  font-weight: 600 !important;
}
td:not(:first), th:not(:first) {
  width: 12rem;
}
td:nth-child(3) {
  background-color: rgb(255, 255, 255, 0.4);
  border-left: 1px solid white;
  border-right: 1px solid white;
  font-weight: bolder;
}
th {
  font-weight: normal;
  color: $imperial-navy-blue;

  b {
    font-weight: 500 !important;
  }

  &:nth-child(3) {
    border-left: 1px solid white;
    border-right: 1px solid white;
  }
}
tbody {
  tr:first-child {
    background-color: rgb(44, 175, 254, 0.1)
  }

  tr:nth-child(4) {
    background-color: rgb(0, 226, 114, 0.1)
  }

  tr:nth-child(7) {
    background-color: rgb(84, 79, 197, 0.1);
  }
}
</style>
