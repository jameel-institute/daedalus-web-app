<script lang="ts" setup>
import { CIcon } from '@coreui/icons-vue'

// Note - datatables bundles in jquery, so we need to be careful that we don't
// end up making every page download jquery!
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net-bs5'
// import 'datatables.net-buttons-bs5';
// import 'datatables.net-buttons/js/buttons.colVis.mjs';
// import 'datatables.net-colreorder-bs5';
// import 'datatables.net-rowgroup-bs5';
// import 'datatables.net-searchpanes-bs5';
// import 'datatables.net-select-bs5';

// The provide/inject wasn't working for components nested inside DataTable slots
import { cilChart, cilChartPie } from '@coreui/icons'

DataTable.use(DataTablesCore)

const columns = [
  { data: 'type', title: 'Type' },
  { data: 'name', title: 'Name' },
  { data: 'date', title: 'Date created' },
  { data: 'tags', title: 'Tags' },
]

const data = [
  {
    id: '1',
    type: 'comparison',
    name: 'All policies (Nigeria)',
    date: '2021-04-25',
    tags: ['Surprising'],
  },
  {
    id: '2',
    type: 'single',
    name: 'Elimination strategy',
    date: '2021-04-25',
    tags: ['Best scenario', 'Baseline'],
  },
]

// Get html rendered by Vue for CIcon component

// Important: Do not use a Vue for statement to populate the table with data unless the
// data is static (i.e. not reactive). Doing so would cause both DataTables and Vue to
// try and control the same DOM elements, resulting in unpredictable behaviour. Bind
// data using the data parameter!
</script>

<template>
  <div>
    <DataTable
      :data="data"
      :columns="columns"
      class="table table-striped table-bordered"
    >
      <template #column-0="props">
        <CIcon v-if="props.cellData === 'comparison'" :icon="cilChart" title="Comparison" />
        <CIcon v-else :icon="cilChartPie" title="Single scenario" />
      </template>
      <template #column-3="props">
        <span
          v-for="tag in props.cellData"
          :key="tag"
          class="tag"
          :style="`background-color: ${['lightgreen', 'lightblue', 'pink'][Math.floor(Math.random() * 3)]}`"
        >
          {{ tag }}
        </span>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
/* Skip datatables' recommended import of bootstrap for the bs5 version, because coreui includes bootstrap */
@import 'datatables.net-bs5';

.tag {
  display: inline-block;
  padding: 0.25em 0.5em;
  margin: 0.25em;
  background-color: #f0f0f0;
  border-radius: 0.25em;
}
</style>

<!-- https://datatables.net/manual/vue -->
 <!--     https://datatables.net/manual/vue#Vue-Components -->

<!-- SPARE USELESS DOCS -->
<!-- https://datatables.net/blog/2022/vue#Styling -->
<!-- https://datatables.net/ -->
<!-- https://github.com/coreui/coreui-datatables - I think this 'fork' does not in fact depart from the upstream repo, LOL -->
<!-- Which, by the way, is https://github.com/DataTables/Dist-DataTables-Bootstrap4 -->
<!-- Which, one imagines, is inferior to the one for B5 https://github.com/DataTables/Dist-DataTables-Bootstrap5 -->
<!-- Which in turn is simply referenced on the posts at the top about datatables <-> Vue, e.g.: -->
<!-- "For the other styling frameworks, you need to also include a Javascript element, which configures DataTables and its extensions to use the styles and DOM structure suitable for the framework selected - e.g. for Bootstrap 5" -->
