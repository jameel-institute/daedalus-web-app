<template>
  <div>
    <p>
      Query parameter: {{ route.params.id }}
    </p>
    <p>
      All ids in the store: {{ allScenarios }}
    </p>
    <h3>
      A decision point. To remember a usersession's info, do we persist pinia store state between page loads using localstorage? Or do we store that in the database already, against a local session id?
    </h3>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const scenarioStore = useScenarioStore();
const { allScenarios } = storeToRefs(scenarioStore);
</script>

<style lang="scss" scoped>

</style>
