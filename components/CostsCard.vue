<template>
  <div class="card costs-card">
    <!-- Todo: Make height dynamic. Matching header of time series. -->
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
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";
import throttle from "lodash.throttle";
import { abbreviateMillionsDollars } from "~/utils/money";

const appStore = useAppStore();

const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});

const hideCostsPieTooltips = ref(false);
const onMouseLeaveCostsPie = () => {
  setTimeout(() => {
    hideCostsPieTooltips.value = true;
  }, 500);
};

const costsCardBody = ref(null);
const costsCardBodyWidth = ref(0);
const costsCardBodyHeight = ref(0);

const gdpTotalCostContainer = ref(null);
const gdpTotalCostContainerWidth = ref(0);
const gdpTotalCostContainerHeight = ref(0);

const usdTotalCostContainer = ref(null);
const usdTotalCostContainerWidth = ref(0);
const usdTotalCostContainerHeight = ref(0);

// Since we're dealing with a circle, make the width and height the same variable
const costsPieSize = ref<number | undefined>(undefined);
const costsPieClass = ref<string>("");

const observeResize = (elementRef: Ref<null>, widthRef: Ref<number>, heightRef: Ref<number>) => {
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

const costsPieBottomRightPosition = ref<number | undefined>(undefined);

const setPieSizeAndStyle = () => {
  if (costsCardBodyWidth.value && costsCardBodyHeight.value
    && gdpTotalCostContainerWidth.value && gdpTotalCostContainerHeight.value
    && usdTotalCostContainerWidth.value && usdTotalCostContainerHeight.value) {
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
        costsPieClass.value = "top-right-corner";
        break;
      case (costsPieMaxSizeBelowUsdTotalCost):
        costsPieClass.value = "below-usd-total-cost";
        break;
      case (costsPieMaxSizeInBottomRight):
        costsPieClass.value = "bottom-right-corner";
    }
  }
};

watch(() => costsCardBody.value, throttle(() => {
  observeResize(costsCardBody, costsCardBodyWidth, costsCardBodyHeight);
  observeResize(gdpTotalCostContainer, gdpTotalCostContainerWidth, gdpTotalCostContainerHeight);
  observeResize(usdTotalCostContainer, usdTotalCostContainerWidth, usdTotalCostContainerHeight);
  setPieSizeAndStyle();
}, 100));

watch([
  costsCardBodyWidth,
  costsCardBodyHeight,
  gdpTotalCostContainerWidth,
  gdpTotalCostContainerHeight,
  usdTotalCostContainerWidth,
  usdTotalCostContainerHeight,
], throttle(() => {
  if (appStore.currentScenario.result.data) {
    setPieSizeAndStyle();
  };
}, 100));
</script>

<style lang="scss" scoped>
@use "sass:map";
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
</style>
