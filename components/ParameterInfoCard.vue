<template>
  <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card">
    <CRow>
      <div
        v-show="!appStore.largeScreen"
        class="card-header h-100 align-content-center"
      >
        <EditParameters />
      </div>
      <CCol class="col-sm">
        <div class="card-body py-2">
          <p class="card-text d-flex gap-3 flex-wrap">
            <CTooltip
              v-for="(parameter) in appStore.metadata?.parameters"
              :key="parameter.id"
              :content="parameter.label"
              placement="top"
            >
              <template #toggler="{ id, on }">
                <span
                  :aria-describedby="id"
                  v-on="on"
                >
                  <ParameterIcon :parameter="parameter" />
                  <span class="ms-1">
                    {{ paramDisplayText(parameter) }}
                  </span>
                  <CIcon v-if="parameter.id === appStore.globeParameter?.id && countryFlagIcon" :icon="countryFlagIcon" class="parameter-icon ms-1" />
                </span>
              </template>
            </CTooltip>
          </p>
        </div>
      </CCol>
      <CCol v-show="appStore.largeScreen" class="col-auto">
        <div class="card-footer h-100 align-content-center">
          <EditParameters />
        </div>
      </CCol>
    </CRow>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import getCountryISO2 from "country-iso-3-to-2";
import type { Parameter } from "~/types/parameterTypes";
import { humanReadableInteger } from "~/components/utils/formatters";

const appStore = useAppStore();

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario?.parameters && appStore.currentScenario?.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();

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

const countryFlagIcon = computed(() => {
  const countryISO3 = appStore.currentScenario?.parameters?.country;
  const countryISO2 = getCountryISO2(countryISO3);
  const titleCaseISO2 = countryISO2?.toLowerCase().replace(/^(.)/, match => match.toUpperCase());
  return countryISO2 ? `cif${titleCaseISO2}` : "";
});
</script>
