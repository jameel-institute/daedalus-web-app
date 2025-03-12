<template>
  <div class="card costs-card">
    <!-- Todo: Make height dynamic. Matching header of time series. -->
    <div id="costsCardBody" class="card-body">
      <CRow>
        <img v-if="!stackBars && !diffing" height="700px" class="col-6 p-3 mb-5" src="~/assets/img/chart.svg">
        <img v-else-if="stackBars && !diffing" height="700px" class="col-6 p-3 mb-5" src="~/assets/img/chart (1).svg">
        <img v-else-if="!stackBars && diffing" height="700px" class="col-6 p-3 mb-5" src="~/assets/img/chart (2).svg">
        <div :class="`col-6 d-flex flex-column gap-3 ${showWidget ? '' : 'pt-5'}`">
          <div class="d-flex align-items-center gap-3 mb-3 mt-3">
            <CFormSwitch
              id="showSubCosts"
              label="Show sub-costs"
            />
            <CButton
              id="sortScenariosButton"
              class="border"
              color="light"
            >
              <CIcon icon="cilSortAscending" size="lg" class="text-secondary" style="transform: rotate(270deg)" />
              <span class="ps-2 position-relative">Sort scenarios by total losses</span>
              <!-- (only offer that if the scenarios do not have a natural ordering?) -->
            </CButton>
            <CButton
              id="stackBarsButton"
              class="border"
              color="light"
              @click.prevent="stackBars = !stackBars"
            >
              <CIcon icon="cilWrapText" size="lg" class="text-secondary" style="transform: rotate(270deg)" />
              <span class="ps-2">Stack bars</span> <!-- toggles split and stack -->
            </CButton>
          </div>
          <div class="d-flex align-items-center gap-3 mb-3">
            <CFormLabel class="mt-2">
              Units
            </CFormLabel>
            <VueSelect
              v-model="costUnits"
              :options="[{ label: '% of 2018 GDP', value: 'gdp' }, { label: '$ USD', value: 'usd' }]"
              label="Select unit"
              :is-clearable="false"
              style="width: 12rem"
            />
          </div>
          <div>
            <CostsLegend />
          </div>
          <div class="mt-3">
            <CostsTable data-testid="costs-table" />
          </div>
          <div v-if="!diffing" class="position-absolute d-flex fs-5" style="bottom: 5rem; left: 11rem; width: 100%;">
            <div>None<span style="color: orange; margin-left: 0.5rem;">★</span></div>
            <div style="margin-left: 6.5rem; font-weight: 500;">Low</div>
            <div style="margin-left: 7.5rem;">Medium</div>
            <div style="margin-left: 6.8rem;">High</div>
          </div>
          <div v-else class="position-absolute d-flex fs-5" style="bottom: 5rem; left: 13.5rem; width: 100%;">
            <div>None<span style="color: orange; margin-left: 0.5rem;">★</span></div>
            <div style="margin-left: 8rem;">Medium</div>
            <div style="margin-left: 10.5rem;">High</div>
          </div>
          <div v-if="showWidget" style="margin-top: -4rem;">
            <h6
              style="background: white;
                padding: 1.5rem;
                padding-left: 0.75rem;
                position: relative;
                top: 4rem;"
            >
              Time series
            </h6>
            <div class="d-flex gap-2">
              <!-- <img class="" src="~/assets/img/smaller sparklines with correct graphs and colors.png"> -->
              <iframe style="background-color: transparent !important" width="100%" height="300" src="//jsfiddle.net/dmears/agy1jLpo/44/embedded/result/" frameborder="0" loading="lazy" allowtransparency="true" allowfullscreen="true" />
            </div>
          </div>
        </div>
      </CRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { abbreviateMillionsDollars } from "@/utils/money";
import { CIcon } from "@coreui/icons-vue";
import VueSelect from "vue3-select-component";

const appStore = useAppStore();
const hideTooltips = ref(false);
const costUnits = ref("gdp");
const stackBars = ref(false);
const diffing = ref(true);
const showWidget = ref(true);

// Display the 'headline' total cost in terms of a percentage of annual national GDP
const gdpTotalCostPercent = computed(() => ((appStore.totalCost!.value / appStore.currentScenario!.result!.data!.gdp) * 100).toFixed(1));

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

<style lang="scss">
@use "sass:map";

#sparkline-heading {
  
}

// When adjusting or testing layout, use the widest possible values for the costs: 555.5% of GDP and 555.5 M USD.
.costs-card {
  .form-switch .form-label.form-check-label {
    margin-bottom: 0 !important;
  }

  border-top: 0;

  color: var(--cui-dark-text-emphasis);

  .vsl-display {
    font-size: $font-size-sm;
  }
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
  .pie-table-container > :nth-child(2) {
    flex-grow: 1;
    display: flex;
    justify-content: center;
  }

  .card-header {
    height: 66.375px; // Hard-coded to match the height of the time series card header
    border-bottom: var(--cui-border-width) solid var(--cui-border-color);

    .btn, .form-check {
      white-space: nowrap !important;
    }
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

  .card {
    opacity: 70%;

    .fs-4 {
      font-size: 1rem !important;
    }
  }
}
</style>
