<template>
  <div id="resultsPage">
    <div class="d-flex flex-wrap mb-3 gap-3">
      <h1 class="fs-2 mb-0 pt-1">
        Results
      </h1>
      <div class="d-inline-block ms-auto">
        <CButton
          color="primary"
          class="btn-scenario-header fs-6 d-flex"
          @click="() => { modalVisible = true; }"
        >
          <CIconSvg class="icon m-0 align-self-center" style="height: 1.2rem; width: 1.2rem;">
            <img src="~/assets/img/axes-white.png" alt="Icon for comparing scenarios">
          </CIconSvg>
          <span class="ms-2 align-self-end">Compare against other scenarios</span>
        </CButton>
      </div>
      <!-- TODO: Use 'size' prop to widen modal when selecting country -->
      <CModal
        id="chooseAxisModal"
        :visible="modalVisible"
        aria-labelledby="chooseAxisModalTitle"
        @close="() => { modalVisible = false; chosenAxis = ''; }"
      >
        <CModalHeader>
          <CModalTitle id="chooseAxisModalTitle">
            <CIconSvg class="icon me-2" style="height: 1.3rem; width: 1.3rem;">
              <img src="~/assets/img/axes-black.png" alt="Icon for comparing scenarios">
            </CIconSvg>
            <span class="pt-1 pe-1">Start a comparison against this baseline</span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p class="fs-5 form-label">
            Which parameter would you like to explore?
          </p>
          <div class="d-flex gap-2 flex-wrap">
            <CButton
              v-for="para in appStore.metadata?.parameters.filter((p) => !chosenAxis || chosenAxis === p.id)"
              :id="chosenAxis === para.id ? 'chosenAxisBtn' : ''"
              :key="para.id"
              :class="`border ${chosenAxis === para.id ? 'bg-primary bg-opacity-10 border-primary-subtle' : ''}`"
              color="light"
              @click="(e) => { chosenAxis = chosenAxis === '' ? para.id : ''; }"
            >
              <ParameterIcon :parameter="para" />
              <span class="ms-2">{{ para.label }}</span>
              <span v-if="chosenAxis === para.id" id="closeX" class="text-muted ms-2">
                <CIcon icon="cilX" />
              </span>
            </CButton>
          </div>
          <div v-if="chosenAxis" class="mt-3">
            <p class="fs-5 form-label">
              Compare baseline scenario
              <span class="multi-value d-inline-block">
                <span class="multi-value-label px-2 fs-6">{{ readableBaselineOption }}</span>
              </span> against:
            </p>
          </div>
        </CModalBody>
      </CModal>
      <DownloadExcel />
      <CodeSnippet />
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl">
          <img src="/icons/rotate-device.svg">
          <!-- License: MIT License https://www.svgrepo.com/svg/451262/rotate-device -->
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
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
    </div>
    <CSpinner v-show="showSpinner" class="ms-3 mb-3 mt-3" />
    <CAlert v-if="appStore.currentScenario.status.data?.runSuccess === false" color="danger">
      The analysis run failed. Please
      <NuxtLink prefetch-on="interaction" to="/scenarios/new">
        <span>try again</span>
      </NuxtLink>.
      <p v-for="(errorMsg, index) in appStore.currentScenario.status.data.runErrors" :key="index">
        {{ errorMsg }}
      </p>
    </CAlert>
    <CAlert
      v-if="!appStore.timeSeriesData && jobSlow && appStore.currentScenario.status.data?.runStatus"
      :color="jobReallySlow ? 'warning' : 'info'"
    >
      <p v-if="jobReallySlow">
        Thank you for waiting. Some scenario analyses can take up to 60 seconds to run. You can carry on waiting or
        <NuxtLink prefetch-on="interaction" to="/scenarios/new">
          <span> try again</span>
        </NuxtLink> with another run.
      </p>
      <p>
        Analysis status: {{ appStore.currentScenario.status.data?.runStatus }}
      </p>
      <p class="mb-0">
        Waiting for {{ secondsSinceFirstStatusPoll }} seconds
      </p>
    </CAlert>
    <CRow v-else-if="appStore.currentScenario.result.data" class="results-cards-container">
      <div class="col-12 col-xl-6">
        <CostsCard />
      </div>
      <div class="col-12 col-xl-6">
        <TimeSeriesCard />
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import getCountryISO2 from "country-iso-3-to-2";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

const appStore = useAppStore();

let statusInterval: NodeJS.Timeout;
const jobSlow = ref(false);
const jobReallySlow = ref(false);
const secondsSinceFirstStatusPoll = ref("0");
const showSpinner = computed(() => !appStore.currentScenario.result.data
  && appStore.currentScenario.status.data?.runSuccess !== false
  && appStore.currentScenario.runId,
);
const modalVisible = ref(false);
const chosenAxis = ref("");
const chosenAxisParameter = computed(() => {
  return appStore.metadata?.parameters.find(p => p.id === chosenAxis.value);
});

const chosenAxisIsNumeric = computed(() => {
  return chosenAxisParameter.value?.parameterType === TypeOfParameter.Numeric;
});

const baselineOption = computed(() => {
  if (chosenAxisIsNumeric.value) {
    return appStore.currentScenario.parameters[chosenAxis.value];
  } else {
    return chosenAxisParameter.value.options.find((o) => {
      return o.id === appStore.currentScenario.parameters[chosenAxis.value];
    });
  }
});

const readableBaselineOption = computed(() => {
  if (chosenAxisIsNumeric.value) {
    return baselineOption.value;
  } else {
    return `${baselineOption.value?.label}`;
  }
});

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario?.parameters && appStore.currentScenario?.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();

    const rawValIsNumberString = Number.parseInt(rawVal).toString() === rawVal;
    if (rawValIsNumberString) {
      // TODO: Localize number formatting.
      return new Intl.NumberFormat().format(Number.parseInt(rawVal));
    }
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

const route = useRoute();
const runIdFromRoute = route.params.runId as string;
if (appStore.currentScenario.runId && runIdFromRoute !== appStore.currentScenario.runId) {
  appStore.clearScenario(); // Required so that previous parameters aren't hanging around in the store.
}
appStore.currentScenario.runId = runIdFromRoute;

const countryFlagIcon = computed(() => {
  const countryISO3 = appStore.currentScenario?.parameters?.country;
  const countryISO2 = getCountryISO2(countryISO3);
  const titleCaseISO2 = countryISO2?.toLowerCase().replace(/^(.)/, match => match.toUpperCase());
  return countryISO2 ? `cif${titleCaseISO2}` : "";
});

// Use useAsyncData to store the time once, during server-side rendering: avoids client render re-writing value.
const { data: timeOfFirstStatusPoll } = await useAsyncData<number>("timeOfFirstStatusPoll", async () => {
  return new Promise<number>((resolve) => {
    resolve(new Date().getTime());
  });
});

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.loadScenarioStatus();
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResult();
}

watch(() => appStore.currentScenario.status.data?.runSuccess, (runSuccess) => {
  if (runSuccess) {
    appStore.loadScenarioResult();
  }
});

watch(() => appStore.currentScenario.status.data?.done, (done) => {
  if (done) {
    clearInterval(statusInterval);
    jobSlow.value = false;
    jobReallySlow.value = false;
  }
});

const pollForStatusEveryNSeconds = (seconds: number) => {
  statusInterval = setInterval(() => {
    if (timeOfFirstStatusPoll.value) {
      secondsSinceFirstStatusPoll.value = ((new Date().getTime() - timeOfFirstStatusPoll.value) / 1000).toFixed(0);
    };
    appStore.loadScenarioStatus();
  }, seconds * 1000);
};

onMounted(() => {
  appStore.globe.interactive = false;

  if (!appStore.currentScenario.status.data?.done && appStore.currentScenario.runId) {
    pollForStatusEveryNSeconds(0.2);
    setTimeout(() => {
      // If the job isn't completed within a few seconds, give user the information about the run status.
      if (!appStore.currentScenario.status.data?.done) {
        jobSlow.value = true;
      }
    }, 5000);
    // Some runs take an especially long time, e.g. Singapore + Omicron.
    setTimeout(() => {
      if (!appStore.currentScenario.status.data?.done) {
        jobReallySlow.value = true;
      }
    }, 15000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss">
.results-cards-container {
  row-gap: 1rem;
}

#resultsPage {
  .card {
    background: rgba(255, 255, 255, 0.5);

    &.horizontal-card {
      height: fit-content;

      .card-header {
        padding: 0;
      }

      .card-footer {
        border-left: var(--cui-card-border-width) solid var(--cui-card-border-color); // copied from .card-header border-bottom
        border-top: none;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: var(--cui-card-inner-border-radius) var(--cui-card-inner-border-radius) 0 0;

        padding-bottom: 0;
        padding-left: 0;
        padding-top: 0;
      }

      .row {
        --cui-gutter-y: 0;
        --cui-gutter-x: 0;
      }
    }
  }

  .modal-dialog {
    max-width: 35rem;
  }

  #chooseAxisModal {
    transition: background-color 0.2s;
  }

  --vs-multi-value-background-color: var(--cui-primary-bg-subtle);
  --vs-multi-value-border-radius: 0.25rem;
}
</style>
