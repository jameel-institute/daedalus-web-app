<template>
  <div class="card costs-card">
    <!-- Todo: Make height dynamic. Matching header of time series. -->
    <div class="card-header d-flex justify-content-between">
      <div class="d-flex align-items-center">
        <CIcon icon="cilBarChart" size="lg" class="mb-1 text-muted" />
        <h2 class="fs-5 m-0 ms-3 chart-header">
          Losses
        </h2>
      </div>
    </div>
    <div id="costsCardBody" class="card-body">
      <h3 id="totalHeading" class="mt-0 mb-1 ms-2 fs-6">
        Total
      </h3>
      <div
        id="totalsContainer"
        class="d-flex flex-wrap gap-3 row-gap-0"
      >
        <div id="gdpContainer" class="d-flex gap-1">
          <p id="gdpTotalCostPercent" class="mt-0 mb-0">
            {{ gdpTotalCostPercent }}
          </p>
          <div id="gdpTotalCostPercentSymbolContainer">
            <p id="gdpTotalCostPercentageSymbol" class="mb-0">
              <span>%</span>
            </p>
            <p id="gdpTotalCostPercentReferent" class="mt-0 mb-0">
              <span>of {{ gdpReferenceYear }} GDP</span>
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
        <div class="me-2 ms-auto gap-3 align-self-end d-flex">
          <CFormLabel>Show losses:</CFormLabel>
          <div>
            <CFormCheck
              id="costBasisGdp"
              v-model="costBasis"
              :inline="true"
              type="radio"
              :label="`as % of ${gdpReferenceYear} GDP`"
              :value="CostBasis.PercentGDP"
            />
            <CFormCheck
              id="costBasisUsd"
              v-model="costBasis"
              :inline="true"
              type="radio"
              label="in USD"
              :value="CostBasis.USD"
            />
          </div>
        </div>
      </div>
      <div class="chart-and-table-container">
        <CostsChart id="costsChartContainer" :basis="costBasis" />
        <div class="flex-grow-1">
          <CostsTable data-testid="costs-table" />
        </div>
      </div>
      <p class="fw-lighter vsl-display">
        * Value of statistical life: ${{ formatCurrency(appStore.currentScenario.result.data!.average_vsl) }} Int'l$
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { costAsPercentOfGdp, gdpReferenceYear, humanReadablePercentOfGdp } from "@/components/utils/formatters";
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";
import { CostBasis } from "~/types/unitTypes";

const appStore = useAppStore();
const costBasis = ref<CostBasis>(CostBasis.USD);

// Display the 'headline' total cost in terms of a percentage of annual national GDP
const gdpTotalCostPercent = computed(() => {
  const totalAsPercentOfGdp = costAsPercentOfGdp(appStore.totalCost?.value, appStore.currentScenario.result.data?.gdp);
  return humanReadablePercentOfGdp(totalAsPercentOfGdp).percent;
});

const totalCostAbbr = computed(() => {
  if (appStore.totalCost) {
    return abbreviateMillionsDollars(appStore.totalCost?.value, 1, true);
  } else {
    return undefined;
  }
});
</script>

<style lang="scss" scoped>
@use "sass:map";

// When adjusting or testing layout, use the widest possible values for the costs: 555.5% of GDP and 555.5 M USD.
.costs-card {
  color: var(--cui-dark-text-emphasis);
}

:deep(.form-check-label) {
  margin-bottom: 0;
}

.vsl-display {
  font-size: $font-size-sm;
}
.card-body {
  display: flex;
  flex-direction: column;
}
.chart-and-table-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.chart-and-table-container > :nth-child(2) {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.card-header {
  height: 46.375px; // Hard-coded to match the height of the time series card header
  border-bottom: var(--cui-border-width) solid var(--cui-border-color);
}

#totalHeading {
  height: fit-content;
  letter-spacing: 0.08rem;
  font-weight: normal;
  text-transform: uppercase;
  text-decoration: underline dotted gray from-font;
  text-underline-offset: 0.1em;
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
    margin-bottom: 1.7rem;

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
  margin-top: 1.2rem;

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
</style>
