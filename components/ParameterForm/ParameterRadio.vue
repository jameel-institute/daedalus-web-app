<template>
  <CRow class="pe-2">
    <ParameterHeader :parameter="props.parameter" />
  </CRow>
  <CRow>
    <CButtonGroup
      role="group"
      :aria-label="props.parameter.label"
      :size="appStore.largeScreen ? 'lg' : undefined"
      :class="`${props.pulsing ? 'pulse' : ''}`"
      @change="$emit('change')"
    >
      <CTooltip
        v-for="(option) in props.parameter.options"
        :key="option.id"
        :content="option.description"
        placement="top"
        :delay="100"
      >
        <template #toggler="{ togglerId, on }">
          <div
            class="radio-btn-container"
            :aria-describedby="togglerId"
            v-on="on"
          >
            <CFormCheck
              :id="option.id"
              v-model="parameterValue"
              type="radio"
              :button="{ color: 'primary', variant: 'outline' }"
              :name="props.parameter.id"
              autocomplete="off"
              :label="option.label"
              :value="option.id"
            />
          </div>
        </template>
      </CTooltip>
    </CButtonGroup>
  </CRow>
</template>

<script lang="ts" setup>
import type { Parameter } from "@/types/parameterTypes";

const props = defineProps<{
  parameter: Parameter
  pulsing: boolean
}>();

defineEmits(["change"]);

const parameterValue = defineModel("parameterValue", { type: String, required: true });

const appStore = useAppStore();
</script>

<style lang="scss">
// Restore radio button group styling to allow for buttons no longer being direct children of button groups - which is
// required for tooltips to display
.btn-group > {
  .radio-btn-container {
    flex-grow: 1;
    .btn {
      width: 100%;
    }
    &:not(:last-child) > {
      .btn {
        border-bottom-right-radius: 0 !important;
        border-top-right-radius: 0 !important;
        border-right-width: 0 !important;
      }
    }
    &:not(:first-child) > {
      .btn {
        border-bottom-left-radius: 0 !important;
        border-top-left-radius: 0 !important;
      }
    }
  }
}

.btn-group-lg > {
  .radio-btn-container > {
    .btn {
      --cui-btn-padding-y: .5rem;
      --cui-btn-padding-x: 1rem;
      --cui-btn-font-size: 1.25rem;
      --cui-btn-border-radius: var(--cui-border-radius-lg);
    }
  }
}
</style>
