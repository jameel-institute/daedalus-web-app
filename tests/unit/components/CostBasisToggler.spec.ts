import CostBasisToggler from "@/components/CostBasisToggler.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { CostBasis } from "~/types/unitTypes";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";
import type { AsyncDataRequestStatus } from "#app";
import { expectTooltipContents } from "./testUtils/tooltipUtils";

const stubs = {
  CIcon: true,
};
const ukScenario = {
  ...emptyScenario,
  parameters: { country: "GBR" },
  result: {
    data: mockResultResponseData,
    fetchError: undefined,
    fetchStatus: "success" as AsyncDataRequestStatus,
  },
};
const usaScenario = {
  ...structuredClone(emptyScenario),
  parameters: { country: "USA" },
  result: {
    ...structuredClone(ukScenario.result),
    data: {
      ...structuredClone(mockResultResponseData),
      gdp: 123456,
      parameters: { country: "USA" },
    },
  },
};

const pinia = mockPinia({
  currentScenario: structuredClone(ukScenario),
  currentComparison: {
    axis: "country",
    baseline: "GBR",
    scenarios: [structuredClone(ukScenario), structuredClone(usaScenario)],
  },
  metadata: mockMetadataResponseData,
}, false, { stubActions: false });

describe("cost basis toggler", () => {
  let originalBodyInnerHTML: string;
  beforeEach(() => {
    originalBodyInnerHTML = document.body.innerHTML;
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyInnerHTML;
    vi.useRealTimers();
  });

  it("should change the cost basis when the radio buttons are clicked", async () => {
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostBasisToggler, {
      global: { stubs, plugins: [pinia] },
      props: { scenarios: [store.currentScenario] },
    });

    expect(store.preferences.costBasis).toBe(CostBasis.USD);

    const gdpRadioButton = component.find(`input[type="radio"][value="${CostBasis.PercentGDP}"]`);
    const usdRadioButton = component.find(`input[type="radio"][value="${CostBasis.USD}"]`);
    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);

    await gdpRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(true);
    expect(usdRadioButton.element.checked).toBe(false);
    expect(store.preferences.costBasis).toBe(CostBasis.PercentGDP);

    await usdRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);
    expect(store.preferences.costBasis).toBe(CostBasis.USD);
  });

  it("should show the correct tooltip content when there is no variance in the national GDP between scenarios", async () => {
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostBasisToggler, {
      global: { stubs, plugins: [pinia] },
      props: { scenarios: [store.currentScenario] },
    });

    const tooltipTrigger = component.find("img");
    expect(tooltipTrigger.attributes("src")).toBe("/icons/info.png");
    await expectTooltipContents(tooltipTrigger, ["pre-pandemic GDP of $19,863.0 billion"]);
  });

  it("should show the correct tooltip content when the scenarios each have a different national GDP", async () => {
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostBasisToggler, {
      global: { stubs, plugins: [pinia] },
      props: { scenarios: store.currentComparison.scenarios },
    });

    const tooltipTrigger = component.find("img");
    expect(tooltipTrigger.attributes("src")).toBe("/icons/info.png");
    await expectTooltipContents(tooltipTrigger, [
      "the following pre-pandemic GDPs",
      "United Kingdom (baseline): $19,863.0 billion",
      "United States: $123.5 billion",
    ]);
  });
});
