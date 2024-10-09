<template>
  <div>
    <div id="title-container" class="d-flex flex-wrap mb-3 gap-3">
      <h1 class="fs-2 mb-0 pt-1">
        Results
      </h1>
      <DownloadExcel />
      <CAlert class="d-sm-none d-flex gap-4 align-items-center" color="info" dismissible>
        <CIconSvg size="xxl">
          <img src="/icons/rotate-device.svg">
          <!-- License: MIT License https://www.svgrepo.com/svg/451262/rotate-device -->
        </CIconSvg>
        <p class="mb-0">
          Rotate your mobile device to landscape for the best experience.
        </p>
      </CAlert>
      <div v-show="appStore.currentScenario?.parameters && appStore.metadata?.parameters" class="card horizontal-card parameters-card">
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
                      <!-- Todo: once metadata uses real country ISOs, get a mapping from 3-letter ISOs to 2-letter ISOs, and look up the correct country flag. -->
                      <CIcon v-if="parameter.id === appStore.globeParameter?.id" icon="cifGb" class="parameter-icon text-secondary ms-1" />
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
    <CAlert v-else-if="stoppedPolling" color="danger">
      <p class="mb-0">
        The analysis is taking longer than expected. Please
        <NuxtLink prefetch-on="interaction" to="/scenarios/new">
          <span>try again</span>
        </NuxtLink>.
      </p>
    </CAlert>
    <CAlert v-else-if="jobTakingLongTime && appStore.currentScenario.status.data?.runStatus" color="info">
      <p class="mb-0">
        Analysis status: {{ appStore.currentScenario.status.data?.runStatus }}
      </p>
    </CAlert>
    <CRow v-else-if="appStore.currentScenario.result.data" class="cards-container">
      <div class="col-12 col-xl-6">
        <div class="card costs-card">
          <!-- Todo, make height dynamic. Matching header of time series. -->
          <div class="card-header border-bottom-0 d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <CIcon icon="cilChartPie" size="xl" class="mb-1 text-secondary" />
              <h2 class="fs-5 m-0 ms-3 chart-header">
                Losses
              </h2>
            </div>
            <CostsLegend />
          </div>
          <div ref="costsCardBody" class="card-body">
            <div id="totalCostContainer">
              <h3 id="totalHeading" class="mt-0 mb-0 fs-6">
                TOTAL
              </h3>
              <div id="gdpTotalCostContainer" ref="gdpTotalCostContainer" class="d-flex gap-1">
                <p id="gdpTotalCostPercent" class="mt-0">
                  X.Y
                </p>
                <div class="align-self-end">
                  <p id="gdpTotalCostPercentageSymbol" class="mb-0">
                    %
                  </p>
                  <p id="gdpTotalCostPercentReferent" class="mt-0 mb-1">
                    of GDP
                  </p>
                </div>
              </div>
              <div id="usdTotalCostContainer" ref="usdTotalCostContainer">
                <div id="currency">
                  <p id="usdSymbol">
                    $
                  </p>
                  <p id="usdWord">
                    USD
                  </p>
                </div>
                <p id="totalCostPara" class="d-inline-block mb-0">
                  <span id="usdTotalCost">
                    <span>{{ totalCostAbbr?.amount }}</span>
                    <span id="totalCostUnit">
                      {{ totalCostAbbr?.unit }}
                    </span>
                  </span>
                </p>
                <p class="mt-0">
                  [insert note about GDP basis]
                </p>
              </div>
            </div>
            <CostsPie
              v-if="costsPieSize"
              :hide-tooltips="hideCostsPieTooltips"
              :pie-class="costsPieClass"
              :bottom-right-position="costsPieBottomRightPosition"
              :pie-size="costsPieSize"
              @mouseleave="onMouseLeaveCostsPie"
              @mouseover="() => { hideCostsPieTooltips = false }"
            />
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card">
          <div class="card-header border-bottom-0 d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <CIcon icon="cilChartLine" size="xl" class="mb-1 text-secondary" />
              <h2 class="fs-5 m-0 ms-3 chart-header">
                Time series
              </h2>
            </div>
            <TimeSeriesLegend />
          </div>
          <TimeSeriesList />
        </div>
      </div>
    </CRow>
  </div>
</template>

<script lang="ts" setup>
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import { throttledWatch } from "@vueuse/core";
import { runStatus } from "~/types/apiResponseTypes";
import type { Parameter } from "~/types/parameterTypes";
import { abbreviateMillionsDollars } from "~/utils/money";

// TODO: Use the runId from the route rather than getting it out of the store.
const appStore = useAppStore();

const hideCostsPieTooltips = ref(false);
const jobTakingLongTime = ref(false);
const stoppedPolling = ref(false);
const showSpinner = computed(() => {
  return (!appStore.currentScenario.result.data
    && appStore.currentScenario.result.fetchStatus !== "error"
    && !stoppedPolling.value);
});
const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});
// const usdTotalCostContainerMaxWidthPx = 295.641; // Measured by setting the text to the longest value it can have, 888.8M

// Since we're dealing with a circle make the width and height the same variable

const costsCardBody = ref(null);
const costsCardBodyWidth = ref(0);
const costsCardBodyHeight = ref(0);

const gdpTotalCostContainer = ref(null);
const gdpTotalCostContainerWidth = ref(0);
const gdpTotalCostContainerHeight = ref(0);

const usdTotalCostContainer = ref(null);
const usdTotalCostContainerWidth = ref(0);
const usdTotalCostContainerHeight = ref(0);

const costsPieSize = ref<number | undefined>(undefined);
const costsPieClass = ref<string>("");

const observeResize = (elementRef: Ref<null>, widthRef: Ref<number>, heightRef: Ref<number>) => {
  console.log('observeResize')
  if (elementRef.value) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        widthRef.value = entry.contentRect.width;
        heightRef.value = entry.contentRect.height;
      }
    });
    observer.observe(elementRef.value);
  }
};

// const availableWidthInTopRightCorner = computed(() => {
//   return costsCardBody.value && gdpTotalCostContainer.value
//     ? (costsCardBodyWidth.value - gdpTotalCostContainerWidth.value)
//     : undefined;
// });
// const availableHeightInTopRightCorner = computed(() => {
//   return costsCardBody.value && gdpTotalCostContainer.value
//     ? (costsCardBodyHeight.value - gdpTotalCostContainerHeight.value)
//     : undefined;
// });
// const costsPieMaxSizeInTopRight = computed(() => {
//   return availableWidthInTopRightCorner.value && availableHeightInTopRightCorner.value
//     ? Math.min(availableWidthInTopRightCorner.value, availableHeightInTopRightCorner.value)
//     : undefined;
// });

// const availableHeightBelowUsdTotalCost = computed(() => {
//   return costsCardBody.value && usdTotalCostContainer.value
//     ? costsCardBodyHeight.value - usdTotalCostContainerHeight.value
//     : undefined;
// });
// const costsPieMaxSizeBelowUsdTotalCost = computed(() => {
//   return costsCardBody.value && availableHeightBelowUsdTotalCost.value
//     ? Math.min(costsCardBodyWidth.value, availableHeightBelowUsdTotalCost.value)
//     : undefined;
// });

// watch(() => costsCardBodyWidth.value, () => {
  // console.log('costsCardBodyHeight', costsCardBodyHeight.value);
  // console.log(costsCardBody.value.clientHeight);
  // console.log('gdpTotalCostContainerHeight', gdpTotalCostContainerHeight.value);
  // console.log(gdpTotalCostContainer.value.clientHeight);

  // console.log(gdpTotalCostContainer.value);
  // console.log(costsCardBody.value);
// });
// const costsPieMaxSizeInBottomRight = computed(() => {
//   // console.log(availableHeightInBottomRightCorner.value);
//   return availableWidthInBottomRightCorner.value && availableHeightInBottomRightCorner.value
//     ? Math.min(availableWidthInBottomRightCorner.value, availableHeightInBottomRightCorner.value)
//     : undefined;
// });

// const costsPieStyle = computed((): StyleValue => {
//   let attrs = {};
//   if (!costsPieSize.value) {
//     console.log("No size available for costs pie.");
//     return attrs;
//   }
//   switch (costsPieSize.value) {
//     case costsPieMaxSizeInTopRight.value:
//       console.error("Top right corner, with size: ", costsPieMaxSizeInTopRight.value);
//       attrs = {
//         top: 0,
//         right: 0,
//         width: costsPieMaxSizeInTopRight.value,
//         height: costsPieMaxSizeInTopRight.value,
//       };
//       break;
//     case (costsPieMaxSizeBelowUsdTotalCost.value):
//       console.error("Below USD total cost, with size: ", costsPieMaxSizeBelowUsdTotalCost.value);
//       attrs = {
//         top: usdTotalCostContainerHeight,
//         right: 0,
//         width: costsPieMaxSizeBelowUsdTotalCost.value,
//         height: costsPieMaxSizeBelowUsdTotalCost.value,
//       };
//       break;
//     case (costsPieMaxSizeInBottomRight.value):
//       console.error("Bottom right corner, with size: ", costsPieMaxSizeInBottomRight.value);
//       attrs = {
//         bottom: 0,
//         right: 0,
//         width: costsPieMaxSizeInBottomRight.value,
//         height: costsPieMaxSizeInBottomRight.value,
//       };
//   }

//   return { ...attrs, position: "absolute" };
// });

const costsPieBottomRightPosition = ref<number | undefined>(undefined);

const setPieSizeAndStyle = () => {
  if (costsCardBodyWidth.value && costsCardBodyHeight.value
    && gdpTotalCostContainerWidth.value && gdpTotalCostContainerHeight.value
    && usdTotalCostContainerWidth.value && usdTotalCostContainerHeight.value) {
    console.log("Calculating costs pie size...");

    const availableWidthInTopRightCorner = costsCardBodyWidth.value - gdpTotalCostContainerWidth.value;
    const availableHeightInTopRightCorner = costsCardBodyHeight.value;
    const costsPieMaxSizeInTopRight = Math.min(availableWidthInTopRightCorner, availableHeightInTopRightCorner);

    const availableHeightBelowUsdTotalCost = costsCardBodyHeight.value - (gdpTotalCostContainerHeight.value + usdTotalCostContainerHeight.value);
    const costsPieMaxSizeBelowUsdTotalCost = Math.min(costsCardBodyWidth.value, availableHeightBelowUsdTotalCost);

    const availableWidthInBottomRightCorner = costsCardBodyWidth.value - usdTotalCostContainerWidth.value;
    const availableHeightInBottomRightCorner = costsCardBodyHeight.value - gdpTotalCostContainerHeight.value;
    const costsPieMaxSizeInBottomRight = Math.min(availableWidthInBottomRightCorner, availableHeightInBottomRightCorner);
    costsPieBottomRightPosition.value = (costsCardBodyWidth.value - costsPieMaxSizeInBottomRight) - usdTotalCostContainerWidth.value;

    costsPieSize.value = Math.max(costsPieMaxSizeInTopRight, costsPieMaxSizeBelowUsdTotalCost, costsPieMaxSizeInBottomRight);

    switch (costsPieSize.value) {
      case costsPieMaxSizeInTopRight:
        console.error("Top right corner, with size: ", costsPieSize.value);
        costsPieClass.value = "top-right-corner";
        break;
      case (costsPieMaxSizeBelowUsdTotalCost):
        console.error("Below USD total cost, with size: ", costsPieSize.value);
        costsPieClass.value = "below-usd-total-cost";
        break;
      case (costsPieMaxSizeInBottomRight):
        console.error("Bottom right corner, with size: ", costsPieSize.value);
        costsPieClass.value = "bottom-right-corner";
    }
  }
};

throttledWatch(() => costsCardBody.value, () => {
  observeResize(costsCardBody, costsCardBodyWidth, costsCardBodyHeight);
  observeResize(gdpTotalCostContainer, gdpTotalCostContainerWidth, gdpTotalCostContainerHeight);
  observeResize(usdTotalCostContainer, usdTotalCostContainerWidth, usdTotalCostContainerHeight);
  setPieSizeAndStyle();
}, { throttle: 250 });

throttledWatch([
  costsCardBodyWidth,
  costsCardBodyHeight,
  gdpTotalCostContainerWidth,
  gdpTotalCostContainerHeight,
  usdTotalCostContainerWidth,
  usdTotalCostContainerHeight,
], () => {
  console.log('watch effect')
  if (appStore.currentScenario.result.data) {
    setPieSizeAndStyle();
  };
}, { throttle: 250 });

// watch(() => costsCardBodyWidth.value, () => {
//   console.log('costsCardBodyWidth', costsCardBodyWidth.value);
// });


// watch(() => costsPieMaxSizeBelowUsdTotalCost.value, () => {
//   console.log('costsPieMaxSizeBelowUsdTotalCost', costsPieMaxSizeBelowUsdTotalCost.value);
// });

const paramDisplayText = (param: Parameter) => {
  if (appStore.currentScenario?.parameters && appStore.currentScenario?.parameters[param.id]) {
    const rawVal = appStore.currentScenario.parameters[param.id].toString();
    return param.options ? param.options.find(({ id }) => id === rawVal)!.label : rawVal;
  }
};

// Eagerly try to load the status and results, in case they are already available and can be used during server-side rendering.
await appStore.loadScenarioStatus();
if (appStore.currentScenario.status.data?.runSuccess) {
  appStore.loadScenarioResult();
}

let statusInterval: NodeJS.Timeout;
const loadScenarioStatus = () => {
  appStore.loadScenarioStatus().then(() => {
    if (appStore.currentScenario.status.data?.runSuccess) {
      clearInterval(statusInterval);
      jobTakingLongTime.value = false;
      appStore.loadScenarioResult();
    }
  });
};

const onMouseLeaveCostsPie = () => {
  setTimeout(() => {
    hideCostsPieTooltips.value = true;
  }, 500);
};

onMounted(() => {
  appStore.globe.interactive = false;

  if (!appStore.currentScenario.status.data?.done && appStore.currentScenario.runId) {
    statusInterval = setInterval(loadScenarioStatus, 200); // Poll for status every N ms
    setTimeout(() => {
      // If the job isn't completed within five seconds, give user the information about the run status.
      if (appStore.currentScenario.status.data?.runStatus !== runStatus.Complete) {
        jobTakingLongTime.value = true;
      }
    }, 5000);
    setTimeout(() => {
      // If the job isn't completed within 10 seconds, terminate polling for status.
      if (!appStore.currentScenario.status.data?.done) {
        jobTakingLongTime.value = false;
        stoppedPolling.value = true;
      }
      clearInterval(statusInterval);
    }, 15000);
  }
});

onUnmounted(() => {
  clearInterval(statusInterval);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

$wrapper-width: calc(100dvw - $sidebar-narrow-width);
$number-of-card-cols: 2;
$col-padding: 1.5rem;
$card-width: calc(($wrapper-width / $number-of-card-cols) - $col-padding);

.cards-container {
  row-gap: 1rem;
}

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

  &.parameters-card {
    .btn-check:checked + .btn, :not(.btn-check) + .btn:active, .btn:first-child:active, .btn.active, .btn.show {
      background-color: unset; // Overrides a style in _theme.scss
    }
  }
}

.costs-card {
  height: $card-container-height;

  .card-body {
    position: relative; // For absolute positioning of costs pie
  }

  #totalHeading {
    height: fit-content;
    letter-spacing: 0.08rem;
    font-weight: normal;
  }

  #gdpTotalCostContainer, #usdTotalCostContainer {
    width: fit-content;
  }

  #gdpTotalCostContainer {
    line-height: 1;
  }

  #gdpTotalCostPercent {
    width: unset;
    font-weight: 200;
    margin-bottom: -2rem;
    font-size: 10rem;

    @media (max-width: map.get($grid-breakpoints, 'md')) {
      font-size: 5rem;
    }

    @media (min-width: map.get($grid-breakpoints, 'md')) {
      text-shadow: 0px 0px 2px;
    }
  }

  #gdpTotalCostPercentageSymbol {
    font-size: 4.5rem;

    @media (max-width: map.get($grid-breakpoints, 'md')) {
      font-size: 2.25rem;
    }

    @media (min-width: map.get($grid-breakpoints, 'md')) {
      text-shadow: 0px 0px 2px;
    }
  }

  #gdpTotalCostPercentReferent {
    font-weight: normal;

    @media (min-width: map.get($grid-breakpoints, 'md')) {
      font-size: 1.5rem;
      text-shadow: 0px 0px 2px;
    }
  }

  #usdTotalCostContainer {
    line-height: 1;

    #usdSymbol {
      font-size: 2.5rem;
      margin-bottom: 0;
      text-align: center;

      @media (max-width: map.get($grid-breakpoints, 'md')) {
        font-size: 2rem;
      }
    }

    #usdWord {
      font-size: 1rem;
      margin-top: 0;
      font-weight: normal !important;

      @media (max-width: map.get($grid-breakpoints, 'md')) {
        font-size: 0.8rem;
      }
    }

    #currency {
      display: inline-block;
      text-align: right;
    }

    #totalCostPara {
      font-size: 5rem;

      @media (max-width: map.get($grid-breakpoints, 'md')) {
        font-size: 4rem;
      }
    }

    #usdTotalCost {
      font-weight: 300;
    }

    #totalCostUnit {
      font-size: smaller;
      font-weight: 300;
    }
  }

  p {
    margin: 0.75rem 0;
    padding: 0;
  }
}

.chart-header {
  height: fit-content;
}
</style>
