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
      <p v-if="parameterLabel === 'Response'">
        For this showcase event, we have limited the response strategy that can be adopted to a severe one. The EPPI team can tell you more about the full range of strategies that are normally available via the Daedalus model.
      </p>
      <p v-if="parameterLabel === 'Change in public behaviour'">
        For this showcase event, we have limited the options for the change in public behaviour. The EPPI team can tell you more about the full range of strategies that are normally available via the Daedalus model.
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
