<template>
  <div>
    <div class="container-fluid d-flex flex-wrap gap-3">
      <h1 class="fs-1">
        Results
      </h1>
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl" class="icon icon-xxl">
          <img src="/icons/rotate-device-svgrepo-com.svg">
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
      <div v-show="appStore.largeScreen && appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card ms-auto">
        <CRow>
          <CCol class="col-auto">
            <div class="card-header h-100 align-content-center">
              Parameters
              <NuxtLink to="/scenarios/new" class="ms-2 link-secondary" title="Edit parameters">
                <CIcon icon="cilPencil" class="form-icon" />
              </NuxtLink>
            </div>
          </CCol>
          <CCol class="col-sm">
            <div class="card-body py-2">
              <p class="card-text d-flex gap-3 flex-wrap">
                <span v-for="(parameter) in appStore.metadata?.parameters" :key="parameter.id">
                  <ParameterIcon :parameter="parameter" />
                  <span v-show="appStore.currentScenario" class="ms-1">
                    {{ paramDisplayText(parameter) }}
                  </span>
                  <!-- Todo: once metadata uses real country ISOs, get a mapping from 3-letter ISOs to 2-letter ISOs, and look up the correct country flag. -->
                  <CIcon v-if="parameter.id === appStore.globeParameter?.id" icon="cifZw" class="parameter-icon text-secondary ms-1" size="sm" />
                </span>
              </p>
            </div>
          </CCol>
        </CRow>
      </div>
      <CAccordion v-show="!appStore.largeScreen && appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="ms-auto">
        <CAccordionItem :item-key="1">
          <CAccordionHeader>
            Parameters
          </CAccordionHeader>
          <CAccordionBody>
            <p v-for="(parameter) in appStore.metadata?.parameters" :key="parameter.id" class="card-text">
              <ParameterIcon :parameter="parameter" />
              <span v-show="appStore.currentScenario" class="ms-2">
                {{ paramDisplayText(parameter) }}
              </span>
              <!-- Todo: once metadata uses real country ISOs, get a mapping from 3-letter ISOs to 2-letter ISOs, and look up the correct country flag. -->
              <CIcon v-if="parameter.id === appStore.globeParameter?.id" icon="cifZw" class="parameter-icon text-secondary ms-1" size="sm" />
            </p>
            <CIcon icon="cilPencil" class="form-icon" />
            <NuxtLink to="/scenarios/new" class="ms-2 link-secondary">
              <span>Edit parameters</span>
            </NuxtLink>
          </CAccordionBody>
        </CAccordionItem>
      </CAccordion>
    </div>
    <p>
      Lorum ipsum dolor sit amet
    </p>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import type { Parameter } from "~/types/parameterTypes";

const appStore = useAppStore();

const paramDisplayText = (param: Parameter) => {
  const rawVal = appStore.currentScenario!.parameters[param.id].toString();
  return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
};

onMounted(() => {
  appStore.globe.interactive = false;
});
</script>

<style lang="scss">
@use "sass:map";

.card {
  background: rgba(255, 255, 255, 0.6);

  &.horizontal-card {
    height: fit-content;

    .card-header {
      border-right: var(--cui-card-border-width) solid var(--cui-card-border-color); // copied from .card-header border-bottom
      border-bottom: none;
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--cui-card-inner-border-radius) var(--cui-card-inner-border-radius) 0 0;
    }

    .row {
      --cui-gutter-y: 0;
      --cui-gutter-x: 0;
    }
  }
}

.accordion {
  width: 300px;
}
</style>
