import { CModal, CTooltip } from "@coreui/vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CodeSnippet from "~/components/CodeSnippet.vue";
import { mockPinia } from "~/tests/unit/mocks/mockPinia";

const stubs = {
  CIcon: true,
};

const parameters = {
  country: "THA",
  pathogen: "influenza_1918",
  response: "none",
  hospital_capacity: "5500",
  vaccine: "high",
};

const expectedSnippetForSingleScenario = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)`;

const scenariosVaryingByVaccine = [
  { parameters: { ...parameters } },
  { parameters: { ...parameters, vaccine: "low" } },
  { parameters: { ...parameters, vaccine: "medium" } },
];
const expectedSnippetForScenariosVaryingByVaccine = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

model_result_high <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)

model_result_low <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "low"
)

model_result_medium <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "medium"
)`;

const scenariosVaryingByCountry = [
  { parameters: { ...parameters } },
  { parameters: { ...parameters, country: "USA", hospital_capacity: "1234567" } },
  { parameters: { ...parameters, country: "GBR", hospital_capacity: "999999" } },
];
const expectedSnippetForScenariosVaryingByCountry = `country_obj_tha <- daedalus::daedalus_country("THA")
country_obj_tha$hospital_capacity <- 5500

model_result_tha <- daedalus::daedalus(
  country_obj_tha,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)

country_obj_usa <- daedalus::daedalus_country("USA")
country_obj_usa$hospital_capacity <- 1234567

model_result_usa <- daedalus::daedalus(
  country_obj_usa,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)

country_obj_gbr <- daedalus::daedalus_country("GBR")
country_obj_gbr$hospital_capacity <- 999999

model_result_gbr <- daedalus::daedalus(
  country_obj_gbr,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)`;

const scenariosVaryingByHospitalCapacity = [
  { parameters: { ...parameters } },
  { parameters: { ...parameters, hospital_capacity: "1234567" } },
  { parameters: { ...parameters, hospital_capacity: "999999" } },
];
const expectedSnippetForScenariosVaryingByHospitalCapacity = `country_obj_5500 <- daedalus::daedalus_country("THA")
country_obj_5500$hospital_capacity <- 5500

model_result_5500 <- daedalus::daedalus(
  country_obj_5500,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)

country_obj_1234567 <- daedalus::daedalus_country("THA")
country_obj_1234567$hospital_capacity <- 1234567

model_result_1234567 <- daedalus::daedalus(
  country_obj_1234567,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)

country_obj_999999 <- daedalus::daedalus_country("THA")
country_obj_999999$hospital_capacity <- 999999

model_result_999999 <- daedalus::daedalus(
  country_obj_999999,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high"
)`;

const mockCopyToClipboard = vi.fn();
const originalNavigator = { ...globalThis.navigator };

describe("code snippet", () => {
  beforeEach(() => {
    globalThis.navigator = {
      clipboard: {
        writeText: mockCopyToClipboard,
      },
    } as any;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    globalThis.navigator = originalNavigator;
    vi.useRealTimers();
  });

  it("renders as expected", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }] },
    });
    expect(component.findComponent(CTooltip).props("content")).toBe("Generate code snippet");
    expect(component.find("button.btn-scenario-header").attributes("aria-label")).toBe("Generate code snippet");
    expect(component.findComponent(CModal).props("visible")).toBe(false);
  });

  it("shows modal with expected snippet for single scenario on button click", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }] },
    });
    await component.find("button.btn-scenario-header").trigger("click");
    expect(component.findComponent(CModal).props("visible")).toBe(true);
    expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

    expect(component.find("pre").text()).toBe(expectedSnippetForSingleScenario);
  });

  describe("shows modal with expected snippet for multiple scenarios", async () => {
    it("when the scenarios vary by vaccine", async () => {
      const component = await mountSuspended(CodeSnippet, {
        global: { stubs, plugins: [mockPinia({ currentComparison: { axis: "vaccine" } }, false, { stubActions: false })] },
        props: { scenarios: scenariosVaryingByVaccine },
      });
      await component.find("button.btn-scenario-header").trigger("click");
      expect(component.findComponent(CModal).props("visible")).toBe(true);
      expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

      expect(component.find("pre").text()).toBe(expectedSnippetForScenariosVaryingByVaccine);
    });

    it("when the scenarios vary by country", async () => {
      const component = await mountSuspended(CodeSnippet, {
        global: { stubs, plugins: [mockPinia({ currentComparison: { axis: "country" } }, false, { stubActions: false })] },
        props: { scenarios: scenariosVaryingByCountry },
      });
      await component.find("button.btn-scenario-header").trigger("click");
      expect(component.findComponent(CModal).props("visible")).toBe(true);
      expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

      expect(component.find("pre").text()).toBe(expectedSnippetForScenariosVaryingByCountry);
    });

    it("when the scenarios vary by hospital capacity", async () => {
      const component = await mountSuspended(CodeSnippet, {
        global: { stubs, plugins: [mockPinia({ currentComparison: { axis: "hospital_capacity" } }, false, { stubActions: false })] },
        props: { scenarios: scenariosVaryingByHospitalCapacity },
      });
      await component.find("button.btn-scenario-header").trigger("click");
      expect(component.findComponent(CModal).props("visible")).toBe(true);
      expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

      expect(component.find("pre").text()).toBe(expectedSnippetForScenariosVaryingByHospitalCapacity);
    });
  });

  it("copies snippet on Copy button click", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }] },
    });
    await component.find("button.btn-scenario-header").trigger("click");
    const copyBtn = component.find("#btn-copy-code");
    expect(copyBtn.text()).toBe("Copy");
    await copyBtn.trigger("click");
    expect(mockCopyToClipboard).toHaveBeenCalledWith(expectedSnippetForSingleScenario);
    expect(copyBtn.text()).toBe("Copied!");
  });

  const expectCopyTextResetAfterDelay = async (event: string) => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }] },
    });
    await component.find("button.btn-scenario-header").trigger("click");
    const copyBtn = component.find("#btn-copy-code");
    await copyBtn.trigger("click");
    await copyBtn.trigger(event);
    // Text should not reset immediately..
    expect(copyBtn.text()).toBe("Copied!");
    // ..but after a delay
    vi.advanceTimersByTime(1500);
    await nextTick();
    expect(copyBtn.text()).toBe("Copy");
  };

  it("resets Copied text on button blur, after delay", async () => {
    await expectCopyTextResetAfterDelay("blur");
  });

  it("resets Copied view on button mouseleave, after delay", async () => {
    await expectCopyTextResetAfterDelay("mouseleave");
  });

  it("renders nothing if some scenario has no parameters", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }, { parameters: undefined }] },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("button").exists()).toBe(false);
    expect(component.findComponent(CModal).exists()).toBe(false);
  });
});
