import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CostsPanel from "~/components/CostsPanel.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { setActivePinia } from "pinia";
import { CModal } from "#components";

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

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
        update: vi.fn(),
        series: [{ setData: vi.fn() }],
      }),
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

describe("costs card", () => {
  beforeEach(() => {
    setActivePinia(pinia);
  });

  it("should render the costs chart container, the total cost, costs table, vsl and total cost in terms of % of GDP", async () => {
    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });
    expect(component.text()).toContain("Losses after 599 days");
    expect(component.find(`#gdpContainer`).text()).toContain("44.9%");

    const totalCostPara = component.find(`p#totalCostPara`);
    const costsTable = component.find('[data-testid="costsTable"]');
    expect(costsTable).toBeTruthy();

    expect(totalCostPara.text()).toBe("8.9T");

    const vslModalComponent = component.findComponent(CModal);
    expect(vslModalComponent.props("visible")).toBe(false);

    await component.find("#vslInfo").trigger("click");

    expect(vslModalComponent.props("visible")).toBe(true);
    expect(vslModalComponent.find("a").attributes("href")).toContain("https://jameel-institute.github.io/daedalus/");
    expect(vslModalComponent.text()).toContain("value of statistical life");
    expect(vslModalComponent.text()).toContain("2,032,236 Int'l$");
  });
});
