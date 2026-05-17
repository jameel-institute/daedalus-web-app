<template>
  <CModal
    :visible="visible"
    aria-labelledby="blockedOptionModalTitle"
    style="margin-top: 6rem;"
    @close="() => emits('close')"
  >
    <CModalHeader>
      <CModalTitle id="blockedOptionModalTitle">
        This parameter is temporarily disabled
      </CModalTitle>
    </CModalHeader>
    <CModalBody v-if="parameterLabel">
      <p>
        For the purposes of the launch event on 19 May 2026, the &lsquo;{{ parameterLabel }}&rsquo; parameter should be left unchanged, to match the baseline scenario for the interactive activity.
      </p>
      <p>
        You are encouraged to try changing the disease, response, global vaccine investment, and hospital capacity parameters to explore how investments may affect the results under a variety of possible pandemics.
      </p>
      <p v-if="fallbackOptionLabel" class="mb-0">
        &lsquo;{{ parameterLabel }}&rsquo; has been reset to &lsquo;{{ fallbackOptionLabel }}&rsquo;.
      </p>
    </CModalBody>
  </CModal>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  parameterLabel: string
  fallbackOptionLabel?: string
}>();

const emits = defineEmits<{
  close: () => void
}>();
</script>
