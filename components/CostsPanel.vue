<template>
  <div class="card costs-card">
    <!-- Todo: Make height dynamic. Matching header of time series. -->
    <div class="card-header d-flex justify-content-between">
      <div class="d-flex align-items-center mt-1">
        <CIcon icon="cilBarChart" size="lg" class="mb-1 text-muted" />
        <h2 class="fs-5 m-0 ms-3">
          Losses after {{ scenarioDuration }} days
        </h2>
      </div>
      <CostMetricToggler class="ms-auto mt-1" />
    </div>
    <div id="costsCardBody" class="card-body">
      <h3 id="totalHeading" class="mt-0 mb-1 ms-2 fs-6">
        {{ appStore.preferences.costMetric === USD_METRIC ? 'Total' : 'Life years lost' }}
      </h3>
      <div
        id="totalsContainer"
        class="d-flex flex-wrap gap-3 row-gap-0"
      >
        <div
          v-if="appStore.preferences.costMetric === USD_METRIC"
          id="gdpContainer"
          class="d-flex gap-1"
        >
          <p id="gdpTotalCostPercent" class="mt-0 mb-0">
            {{ gdpTotalCostPercent }}
          </p>
          <div id="gdpTotalCostPercentSymbolContainer">
            <p id="gdpTotalCostPercentageSymbol" class="mb-0">
              <span>%</span>
            </p>
            <p id="gdpTotalCostPercentReferent" class="mt-0 mb-0">
              <span>of GDP</span>
            </p>
          </div>
        </div>
        <div
          v-if="appStore.preferences.costMetric === LIFE_YEARS_METRIC"
          id="lifeYearsContainer"
          class="d-flex gap-1"
        >
          <p id="lifeYearsTotalCost" class="mt-0 mb-0">
            {{ lifeYears }}
          </p>
        </div>
        <div v-if="appStore.preferences.costMetric === USD_METRIC" id="usdContainer">
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
              <span>{{ totalCostAbbr?.amount.replace("$", "") }}</span>
              <span id="totalCostUnit">
                {{ totalCostAbbr?.unit }}
              </span>
            </span>
          </p>
        </div>
        <div class="me-2 ms-auto">
          <CostBasisToggler :scenarios="[appStore.currentScenario]" />
        </div>
      </div>
      <div class="d-flex flex-wrap gap-3">
        <TotalCostsChart v-if="appStore.preferences.costMetric === USD_METRIC" />
        <LifeYearsCostsChartClient v-if="appStore.preferences.costMetric === LIFE_YEARS_METRIC" />
        <CostsTable
          data-testid="costs-table"
          class="flex-grow-1 px-2"
          :scenarios="[appStore.currentScenario]"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "@/components/utils/formatters";
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";
import LifeYearsCostsChartClient from "./Charts/LifeYearsCostsChart.client.vue";
import CostMetricToggler from "./CostMetricToggler.vue";
import { lifeYearsAbbreviated } from "./Charts/utils/costCharts";

const appStore = useAppStore();

const totalCost = computed(() => appStore.getScenarioTotalCost(appStore.currentScenario));

const totalCostUSD = computed(() => {
  return totalCost.value?.values.find(c => c.metric === USD_METRIC)?.value;
});

// Display the 'headline' total cost in terms of a percentage of annual national GDP
const gdpTotalCostPercent = computed(() => {
  const totalAsPercentOfGdp = costAsPercentOfGdp(totalCostUSD.value, appStore.currentScenario.result.data?.gdp);
  return humanReadablePercentOfGdp(totalAsPercentOfGdp).percent.replace("%", "");
});

const totalCostAbbr = computed(() => {
  if (totalCostUSD.value !== undefined) {
    return abbreviateMillionsDollars(totalCostUSD.value, true);
  } else {
    return undefined;
  }
});

const lifeYears = computed(() => {
  const lifeYearsRaw = totalCost.value?.children?.find(c => c.id === "life_years")?.values.find(v => v.metric === LIFE_YEARS_METRIC)?.value;
  return lifeYearsRaw ? lifeYearsAbbreviated(lifeYearsRaw) : "";
});

const scenarioDuration = computed(() =>
  Object.values(appStore.currentScenario.result.data?.time_series || {})[0].length - 1);
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

.card-body {
  display: flex;
  flex-direction: column;
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

#gdpContainer, #lifeYearsContainer {
  line-height: 1;

  #gdpTotalCostPercent, #lifeYearsTotalCost {
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
