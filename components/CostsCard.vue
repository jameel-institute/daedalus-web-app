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
    </div>
    <div id="costsCardBody" class="card-body">
      <h3 id="totalHeading" class="mt-0 mb-0 fs-6">
        TOTAL
      </h3>
      <div
        id="totalsContainer"
        ref="totalsContainer"
        class="d-flex flex-wrap gap-3 row-gap-0"
      >
        <div id="gdpContainer" class="d-flex gap-1">
          <p id="gdpTotalCostPercent" class="mt-0 mb-0">
            X.Y
          </p>
          <div id="gdpTotalCostPercentSymbolContainer">
            <p id="gdpTotalCostPercentageSymbol" class="mb-0">
              %
            </p>
            <p id="gdpTotalCostPercentReferent" class="mt-0 mb-0">
              of GDP
            </p>
          </div>
        </div>
        <div id="usdContainer">
          <div id="currency">
            <p id="usdSymbol">
              $
            </p>
            <p id="usdWord">
              USD
            </p>
          </div>
          <p id="totalCostPara" class="d-inline-block">
            <span id="usdTotalCost">
              <span>{{ totalCostAbbr?.amount }}</span>
              <span id="totalCostUnit">
                {{ totalCostAbbr?.unit }}
              </span>
            </span>
          </p>
        </div>
      </div>
      <div class="pie-table-container">
        <div class="flex-grow-1">
          <CostsTable data-testid="costs-table" />
        </div>
        <CostsPie
          id="costsPieContainer"
          :hide-tooltips="hideTooltips"
          @mouseleave="onMouseLeavePie"
          @mouseover="hideTooltips = false"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";

const appStore = useAppStore();
const totalsContainer = ref(null);
const hideTooltips = ref(false);

const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});

const onMouseLeavePie = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 300);
};
</script>

<style lang="scss" scoped>
@use "sass:map";

// When adjusting or testing layout, use the widest possible values for the costs: 555.5% of GDP and 555.5 M USD.
.costs-card {
  color: var(--cui-dark-text-emphasis);

  .card-body {
    display: flex;
    flex-direction: column;
  }
  .pie-table-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  #totalHeading {
    height: fit-content;
    letter-spacing: 0.08rem;
    font-weight: normal;
  }

  #gdpContainer,
  #usdContainer {
    width: fit-content;
  }

  #gdpContainer {
    line-height: 1;

    #gdpTotalCostPercent {
      width: unset;
      font-weight: 200;
      font-size: 5rem;
    }

    #gdpTotalCostPercentSymbolContainer {
      align-self: flex-end;
      margin-bottom: 1.5rem;

      #gdpTotalCostPercentageSymbol {
        font-size: 3rem;
      }

      #gdpTotalCostPercentReferent {
        min-width: 3.5rem;
        font-weight: normal;
        font-size: smaller;
      }
    }
  }

  #usdContainer {
    line-height: 1;
    margin-top: 1rem;

    #usdSymbol {
      font-size: 2rem;
      margin-bottom: 0;
      text-align: center;
    }

    #usdWord {
      margin-top: 0;
      font-weight: normal !important;
      font-size: smaller;
    }

    #currency {
      display: inline-block;
      text-align: right;
    }

    #usdTotalCost {
      font-size: 3.5rem;
      font-weight: 300;
    }

    #totalCostUnit {
      font-size: smaller;
      font-weight: 300;
    }
  }
}
</style>
