<template>
  <div class="progress-group">
    <div class="progress-group-header">
      <div>Analyses in progress</div>
      <div class="ms-5">1 of 4 completed</div>
    </div>
    <div class="progress-group-bars"> 
      <CProgress :value="25" variant="striped" animated/>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>

</style>