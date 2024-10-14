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
    <div id="cardBody" ref="cardBody" class="card-body">
      <div id="totalsContainer" ref="totalsContainer">
        <h3 id="totalHeading" class="mt-0 mb-0 fs-6">
          TOTAL
        </h3>
        <div id="gdpContainer" ref="gdpContainer" class="d-flex gap-1">
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
        <div id="usdContainer" ref="usdContainer">
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
        v-if="pieSize"
        :hide-tooltips="hideTooltips"
        :pie-class="pieClass"
        :right-position="rightPosition"
        :pie-size="pieSize"
        @mouseleave="onMouseLeavePie"
        @mouseover="() => { hideTooltips = false }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";
import throttle from "lodash.throttle";

const appStore = useAppStore();

const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});

const hideTooltips = ref(false);
const onMouseLeavePie = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};

const cardBody = ref(null);
const cardBodyWidth = ref(0);
const cardBodyHeight = ref(0);

const totalsContainer = ref(null);
const totalsContainerWidth = ref(0);
const totalsContainerHeight = ref(0);

const gdpContainer = ref(null);
const gdpContainerWidth = ref(0);
const gdpContainerHeight = ref(0);

const usdContainer = ref(null);
const usdContainerWidth = ref(0);
const usdContainerHeight = ref(0);

// Since we're dealing with a circle, make the width and height the same variable
const pieSize = ref<number | undefined>(undefined);
const pieClass = ref<string>("");
const rightPosition = ref<number | undefined>(undefined);
const dimensionRefs = [
  cardBodyWidth,
  cardBodyHeight,
  totalsContainerWidth,
  totalsContainerHeight,
  gdpContainerWidth,
  gdpContainerHeight,
  usdContainerWidth,
  usdContainerHeight,
];

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

const maxSizeInTopRight = () => {
  const availableWidthInTopRightCorner = cardBodyWidth.value - Math.max(gdpContainerWidth.value, usdContainerWidth.value);
  const availableHeightInTopRightCorner = cardBodyHeight.value;
  const maxSizeInTopRight = Math.min(availableWidthInTopRightCorner, availableHeightInTopRightCorner);
  let rightPosition = 0;
  if (maxSizeInTopRight < availableWidthInTopRightCorner) {
    rightPosition = (availableWidthInTopRightCorner - maxSizeInTopRight) / 2;
  }
  return [maxSizeInTopRight, rightPosition];
};

const maxSizeBelowUsdTotal = () => {
  const availableHeightBelowUsdTotalCost = cardBodyHeight.value - totalsContainerHeight.value;
  const maxSizeBelowUsd = Math.min(cardBodyWidth.value, availableHeightBelowUsdTotalCost);
  let rightPosition = 0;
  if (maxSizeBelowUsd < cardBodyWidth.value) {
    rightPosition = (cardBodyWidth.value - maxSizeBelowUsd) / 2;
  };
  return [maxSizeBelowUsd, rightPosition];
};

const maxSizeInBottomRight = () => {
  const availableWidthInBottomRightCorner = cardBodyWidth.value - usdContainerWidth.value;
  const availableHeightInBottomRightCorner = cardBodyHeight.value - (totalsContainerHeight.value - usdContainerHeight.value);
  const maxSizeInBottomRight = Math.min(availableWidthInBottomRightCorner, availableHeightInBottomRightCorner);
  let rightPosition = 0;
  if (maxSizeInBottomRight < availableWidthInBottomRightCorner) {
    rightPosition = (cardBodyWidth.value - maxSizeInBottomRight) - usdContainerWidth.value;
  }
  return [maxSizeInBottomRight, rightPosition];
};

const setPieSizeAndStyle = () => {
  if (dimensionRefs.every(ref => ref.value)) {
    const [topRightMaxSize, topRightPosition] = maxSizeInTopRight();
    const [belowUsdMaxSize, belowUsdPosition] = maxSizeBelowUsdTotal();
    const [bottomRightMaxSize, bottomRightPosition] = maxSizeInBottomRight();

    pieSize.value = Math.max(topRightMaxSize, belowUsdMaxSize, bottomRightMaxSize);

    switch (pieSize.value) {
      case topRightMaxSize:
        pieClass.value = "top-right-corner";
        rightPosition.value = topRightPosition;
        break;
      case belowUsdMaxSize:
        pieClass.value = "below-usd-total-cost";
        rightPosition.value = belowUsdPosition;
        break;
      case bottomRightMaxSize:
        pieClass.value = "bottom-right-corner";
        rightPosition.value = bottomRightPosition;
    }
  }
};

watch(() => cardBody.value, () => {
  observeResize(cardBody, cardBodyWidth, cardBodyHeight);
  observeResize(totalsContainer, totalsContainerWidth, totalsContainerHeight);
  observeResize(gdpContainer, gdpContainerWidth, gdpContainerHeight);
  observeResize(usdContainer, usdContainerWidth, usdContainerHeight);
  setPieSizeAndStyle();
});

watch(dimensionRefs, throttle(() => {
  if (appStore.currentScenario.result.data) {
    setPieSizeAndStyle();
  };
}, 100));
</script>

<style lang="scss" scoped>
@use "sass:map";
$title-container-height: 40px;
$card-container-height: calc($min-wrapper-height - $title-container-height);

.costs-card {
  @media (min-width: map.get($grid-breakpoints, 'lg')) {
    height: $card-container-height;
  }

  .card-body {
    position: relative; // For absolute positioning of costs pie
  }

  #totalHeading {
    height: fit-content;
    letter-spacing: 0.08rem;
    font-weight: normal;
  }

  #gdpContainer, #usdContainer {
    width: fit-content;
  }

  #gdpContainer {
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

  #usdContainer {
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
