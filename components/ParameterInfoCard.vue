<template>
  <div v-show="props.scenario?.parameters && appStore.metadata?.parameters" class="card">
    <slot name="header" />
    <div class="card-body py-2 d-flex align-items-center">
      <p class="card-text d-flex gap-3 flex-wrap">
        <CTooltip
          v-for="(parameter) in appStore.metadata?.parameters"
          :key="parameter.id"
          :content="parameter.label"
          placement="top"
        >
          <template #toggler="{ id, on }">
            <span
              class="d-flex"
              :aria-describedby="id"
              v-on="on"
            >
              <ParameterIcon :parameter="parameter" />
              <span class="ms-1">
                {{ paramDisplayText(parameter) }}
              </span>
              <span
                v-if="parameter === appStore.globeParameter"
                :class="`${countryFlagClass(props.scenario?.parameters?.country)} ms-1 align-self-center mb-1`"
                style="width: 1.2rem; height: 0.9rem"
              />
            </span>
          </template>
        </CTooltip>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Parameter } from "~/types/parameterTypes";
import { humanReadableInteger } from "./utils/formatters";
import { countryFlagClass } from "./utils/countryFlag";
import type { Scenario } from "~/types/storeTypes";

const props = defineProps<{
  scenario?: Scenario
}>();

const appStore = useAppStore();

const paramDisplayText = (param: Parameter) => {
  if (props.scenario?.parameters && props.scenario?.parameters[param.id]) {
    const rawVal = props.scenario.parameters[param.id].toString();

    const rawValIsIntString = Number.parseInt(rawVal).toString() === rawVal;
    if (rawValIsIntString) {
      return humanReadableInteger(rawVal);
    } else if (param.options) {
      return param.options.find(({ id }) => id === rawVal)!.label;
    } else {
      return rawVal;
    }
  }
};
</script>

<style lang="scss" scoped>
.card {
  height: fit-content;

  .row {
    --cui-gutter-y: 0;
    --cui-gutter-x: 0;
  }
}
</style>;
