<!-- This component expects to be placed within a container with 'display: flex' and 'flex-direction: column'
     so that it appears at the bottom right of the container. -->
<template>
  <div class="mt-auto align-self-end">
    <p :class="`text-secondary mt-4 mb-0 ${props.customClasses}`">
      For full details on the underlying DAEDALUS model, visit the
      <a href="https://github.com/jameel-institute/daedalus" target="_blank">GitHub</a>
      page and read
      <a href="https://www.nature.com/articles/s43588-022-00233-0" target="_blank">Haw et al (2022)</a>.
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  customClasses: {
    type: String,
    default: "",
  },
});
</script>
