import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CostsCard from "@/components/CostsCard.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { setActivePinia } from "pinia";
import { expectTooltipContents } from "./testUtils/tooltipUtils";

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

let originalBodyInnerHTML: string;
describe("costs card", () => {
  beforeEach(() => {
    setActivePinia(pinia);
    originalBodyInnerHTML = document.body.innerHTML;
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyInnerHTML;
    vi.useRealTimers();
  });

  it("should render the costs chart container, the total cost, costs table, vsl and total cost in terms of % of GDP", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins: [pinia] } });
    expect(component.text()).toContain("Losses after 599 days");
    expect(component.find(`#gdpContainer`).text()).toContain("44.9%");

    const totalCostPara = component.find(`p#totalCostPara`);
    const costsTable = component.find('[data-testid="costsTable"]');
    expect(costsTable).toBeTruthy();

    expect(totalCostPara.text()).toBe("8.9T");

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers[1].attributes("src")).toBe("/icons/info.png");
    await expectTooltipContents(tooltipTriggers[1], ["Value of statistical life: 2,799,263 Int'l$"]);
  });
});
