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
        v-if="pieStyle.height"
        :hide-tooltips="hideTooltips"
        :pie-size="styleWithLargestPie.height"
        :style="pieStyle"
        @mouseleave="onMouseLeavePie"
        @mouseover="() => { hideTooltips = false }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";

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
const totalsContainer = ref(null);
const gdpContainer = ref(null);
const usdContainer = ref(null);
const containers = {
  cardBody: { ref: cardBody, width: ref(0), height: ref(0) },
  totals: { ref: totalsContainer, width: ref(0), height: ref(0) },
  gdp: { ref: gdpContainer, width: ref(0), height: ref(0) },
  usd: { ref: usdContainer, width: ref(0), height: ref(0) },
};

// The first of three candidate styles that will be evaluated for how much space they can provide for the pie.
const topRightStyle = computed(() => {
  // What is the maximum size the pie can be if it is in the top right corner?
  const availableWidthInTopRightCorner = containers.cardBody.width.value - Math.max(containers.gdp.width.value, containers.usd.width.value);
  const availableHeightInTopRightCorner = containers.cardBody.height.value;
  const maxSizeInTopRight = Math.min(availableWidthInTopRightCorner, availableHeightInTopRightCorner);
  let rightPosition = 0;
  if (maxSizeInTopRight < availableWidthInTopRightCorner) {
    // If spare horizontal space, calculate a value for the 'right' CSS property for centering.
    rightPosition = (availableWidthInTopRightCorner - maxSizeInTopRight) / 2;
  }
  return {
    height: maxSizeInTopRight,
    right: rightPosition,
    top: 0,
  };
});

// The second of three candidate styles that will be evaluated for how much space they can provide for the pie.
const belowUsdTotalStyle = computed(() => {
  // What is the maximum size the pie can be if it is entirely below the USD total cost container?
  const availableHeightBelowUsdTotalCost = containers.cardBody.height.value - containers.totals.height.value;
  const maxSizeBelowUsd = Math.min(containers.cardBody.width.value, availableHeightBelowUsdTotalCost);
  let rightPosition = 0;
  if (maxSizeBelowUsd < containers.cardBody.width.value) {
    // If spare horizontal space, calculate a value for the 'right' CSS property for centering.
    rightPosition = (containers.cardBody.width.value - maxSizeBelowUsd) / 2;
  };
  return {
    height: maxSizeBelowUsd,
    right: rightPosition,
    bottom: 0,
  };
});

// The third of three candidate styles that will be evaluated for how much space they can provide for the pie.
const bottomRightStyle = computed(() => {
  // What is the maximum size the pie can be if it is in the bottom right, and able to expand into the cleft between the GDP total cost and USD total cost?
  const availableWidthInBottomRightCorner = containers.cardBody.width.value - containers.usd.width.value;
  const availableHeightInBottomRightCorner = containers.cardBody.height.value - (containers.totals.height.value - containers.usd.height.value);
  const maxSizeInBottomRight = Math.min(availableWidthInBottomRightCorner, availableHeightInBottomRightCorner);
  let rightPosition = 0;
  if (maxSizeInBottomRight < availableWidthInBottomRightCorner) {
    // If spare horizontal space, calculate a value for the 'right' CSS property for centering.
    rightPosition = (containers.cardBody.width.value - maxSizeInBottomRight) - containers.usd.width.value;
  }
  return {
    height: maxSizeInBottomRight,
    right: rightPosition,
    bottom: 0,
  };
});

const styleWithLargestPie = computed(() => [topRightStyle.value, belowUsdTotalStyle.value, bottomRightStyle.value].sort((a, b) => b.height - a.height)[0]);

const pieStyle = computed(() => {
  return {
    ...styleWithLargestPie.value,
    right: `${styleWithLargestPie.value.right}px`,
    height: `${styleWithLargestPie.value.height}px`,
    width: `${styleWithLargestPie.value.height}px`, // Since we are dealing with circles, the container's width and height are the same
  };
});

// Once the card body is rendered, add observers to the sizes of the it and the containers within it.
watch(() => containers.cardBody.ref.value, () => {
  Object.values(containers).forEach((container) => {
    if (container.ref.value) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          container.width.value = entry.contentRect.width;
          container.height.value = entry.contentRect.height;
        }
      });
      observer.observe(container.ref.value);
    }
  });
});
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
