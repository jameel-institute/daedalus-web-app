import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CostBasisToggler from "@/components/CostBasisToggler.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { setActivePinia } from "pinia";

const stubs = {
  CIcon: true,
};
const pinia = mockPinia(
  {
    currentScenario: {
      ...emptyScenario,
      parameters: {
        country: "USA",
      },
      result: {
        data: mockResultResponseData as ScenarioResultData,
        fetchError: undefined,
        fetchStatus: "success",
      },
    },
  },
  true,
  { stubActions: false },
);

describe("cost basis toggler", () => {
  beforeEach(() => {
    setActivePinia(pinia);
  });

  it("should change the cost basis when the radio buttons are clicked", async () => {
    const appStore = useAppStore();
    const component = await mountSuspended(CostBasisToggler, { global: { stubs, plugins: [pinia] } });

    expect(appStore.preferences.costBasis).toBe(CostBasis.USD);

    const gdpRadioButton = component.find(`input[type="radio"][value="${CostBasis.PercentGDP}"]`);
    const usdRadioButton = component.find(`input[type="radio"][value="${CostBasis.USD}"]`);
    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);

    await gdpRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(true);
    expect(usdRadioButton.element.checked).toBe(false);
    expect(appStore.preferences.costBasis).toBe(CostBasis.PercentGDP);

    await usdRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);
    expect(appStore.preferences.costBasis).toBe(CostBasis.USD);
  });
});
