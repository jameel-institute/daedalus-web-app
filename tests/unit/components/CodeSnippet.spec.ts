import { CModal, CTooltip } from "@coreui/vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CodeSnippet from "~/components/CodeSnippet.vue";
import { mockPinia } from "~/tests/unit/mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";

const stubs = {
  CIcon: true,
};

const parameters = {
  country: "THA",
  pathogen: "influenza_1918",
  response: "none",
  hospital_capacity: "5500",
  vaccine: "high",
  behaviour: "none",
};

const expectedSnippetForSingleScenario = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = NULL
)`;

const scenarioNonNullBehaviour = { parameters: { ...parameters, behaviour: "high" } };
const expectedSnippetForSingleScenarioWithNonNullBehaviour = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

behaviour_obj <- daedalus::daedalus_new_behaviour(
  hospital_capacity = 5500,
  baseline_optimism = 0.25,
  responsiveness = 0.01,
  behav_effectiveness = 0.2
)

model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour_obj
)`;

const scenariosVaryingByVaccine = [
  { parameters: { ...parameters, behaviour: "high" } },
  { parameters: { ...parameters, behaviour: "high", vaccine: "low" } },
  { parameters: { ...parameters, behaviour: "high", vaccine: "medium" } },
];
const expectedSnippetForScenariosVaryingByVaccine = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

behaviour_obj <- daedalus::daedalus_new_behaviour(
  hospital_capacity = 5500,
  baseline_optimism = 0.25,
  responsiveness = 0.01,
  behav_effectiveness = 0.2
)

vaccine_high_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour_obj
)

vaccine_low_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "low",
  behaviour_obj
)

vaccine_medium_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "medium",
  behaviour_obj
)`;

const scenariosVaryingByBehaviour = [
  { parameters: { ...parameters } },
  { parameters: { ...parameters, behaviour: "low" } },
  { parameters: { ...parameters, behaviour: "medium" } },
];
const expectedSnippetForScenariosVaryingByBehaviour = `country_obj <- daedalus::daedalus_country("THA")
country_obj$hospital_capacity <- 5500

behaviour_none_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = NULL
)

behaviour_low_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 5500,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)

behaviour_medium_model_result <- daedalus::daedalus(
  country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 5500,
    baseline_optimism = 0.5,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)`;

const scenariosVaryingByCountry = [
  { parameters: { ...parameters, behaviour: "low" } },
  { parameters: { ...parameters, behaviour: "low", country: "USA", hospital_capacity: "1234567" } },
  { parameters: { ...parameters, behaviour: "low", country: "GBR", hospital_capacity: "999999" } },
];
const expectedSnippetForScenariosVaryingByCountry = `tha_country_obj <- daedalus::daedalus_country("THA")
tha_country_obj$hospital_capacity <- 5500

tha_model_result <- daedalus::daedalus(
  tha_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 5500,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)

usa_country_obj <- daedalus::daedalus_country("USA")
usa_country_obj$hospital_capacity <- 1234567

usa_model_result <- daedalus::daedalus(
  usa_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 1234567,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)

gbr_country_obj <- daedalus::daedalus_country("GBR")
gbr_country_obj$hospital_capacity <- 999999

gbr_model_result <- daedalus::daedalus(
  gbr_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 999999,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)`;

const scenariosVaryingByHospitalCapacity = [
  { parameters: { ...parameters, behaviour: "low" } },
  { parameters: { ...parameters, behaviour: "low", hospital_capacity: "1234567" } },
  { parameters: { ...parameters, behaviour: "low", hospital_capacity: "999999" } },
];
const expectedSnippetForScenariosVaryingByHospitalCapacity = `hospital_capacity_5500_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_5500_country_obj$hospital_capacity <- 5500

hospital_capacity_5500_model_result <- daedalus::daedalus(
  hospital_capacity_5500_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 5500,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)

hospital_capacity_1234567_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_1234567_country_obj$hospital_capacity <- 1234567

hospital_capacity_1234567_model_result <- daedalus::daedalus(
  hospital_capacity_1234567_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 1234567,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)

hospital_capacity_999999_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_999999_country_obj$hospital_capacity <- 999999

hospital_capacity_999999_model_result <- daedalus::daedalus(
  hospital_capacity_999999_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = daedalus::daedalus_new_behaviour(
    hospital_capacity = 999999,
    baseline_optimism = 0.75,
    responsiveness = 0.01,
    behav_effectiveness = 0.2
  )
)`;

const scenariosVaryingByHospitalCapacityWithNoneBehaviour = [
  { parameters: { ...parameters, behaviour: "none" } },
  { parameters: { ...parameters, behaviour: "none", hospital_capacity: "1234567" } },
  { parameters: { ...parameters, behaviour: "none", hospital_capacity: "999999" } },
];
const expectedSnippetForScenariosVaryingByHospitalCapacityWithNoneBehaviour = `hospital_capacity_5500_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_5500_country_obj$hospital_capacity <- 5500

hospital_capacity_5500_model_result <- daedalus::daedalus(
  hospital_capacity_5500_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = NULL
)

hospital_capacity_1234567_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_1234567_country_obj$hospital_capacity <- 1234567

hospital_capacity_1234567_model_result <- daedalus::daedalus(
  hospital_capacity_1234567_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = NULL
)

hospital_capacity_999999_country_obj <- daedalus::daedalus_country("THA")
hospital_capacity_999999_country_obj$hospital_capacity <- 999999

hospital_capacity_999999_model_result <- daedalus::daedalus(
  hospital_capacity_999999_country_obj,
  "influenza_1918",
  response_strategy = "none",
  vaccine_investment = "high",
  behaviour = NULL
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

  it("shows modal with expected snippet for single scenario on button click, when behaviour option is 'none'", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [{ parameters }] },
    });
    await component.find("button.btn-scenario-header").trigger("click");
    expect(component.findComponent(CModal).props("visible")).toBe(true);
    expect(component.findComponent(CModal).text()).toContain("the current parameters");
    expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

    expect(component.find("pre").text()).toBe(expectedSnippetForSingleScenario);
  });

  it("shows modal with expected snippet for single scenario on button click, when behaviour option is NOT 'none'", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs },
      props: { scenarios: [scenarioNonNullBehaviour] },
    });
    await component.find("button.btn-scenario-header").trigger("click");
    expect(component.findComponent(CModal).props("visible")).toBe(true);
    expect(component.findComponent(CModal).text()).toContain("the current parameters");
    expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");
    expect(component.find("pre").text()).toBe(expectedSnippetForSingleScenarioWithNonNullBehaviour);
  });

  describe("shows modal with expected snippet for multiple scenarios", async () => {
    const testCases = [
      {
        description: "when the scenarios vary by vaccine",
        scenarios: scenariosVaryingByVaccine,
        axis: "vaccine",
        expectedSnippet: expectedSnippetForScenariosVaryingByVaccine,
      },
      {
        description: "when the scenarios vary by country (which affects hospital capacity, which behaviour depends on)",
        scenarios: scenariosVaryingByCountry,
        axis: "country",
        expectedSnippet: expectedSnippetForScenariosVaryingByCountry,
      },
      {
        description: "when the scenarios vary by hospital capacity (which behaviour and country objects depend on)",
        scenarios: scenariosVaryingByHospitalCapacity,
        axis: "hospital_capacity",
        expectedSnippet: expectedSnippetForScenariosVaryingByHospitalCapacity,
      },
      {
        description: "when the scenarios vary by behaviour",
        scenarios: scenariosVaryingByBehaviour,
        axis: "behaviour",
        expectedSnippet: expectedSnippetForScenariosVaryingByBehaviour,
      },
      {
        description: "when the scenarios vary by something behaviour depends on, except that behaviour is none for all scenarios",
        scenarios: scenariosVaryingByHospitalCapacityWithNoneBehaviour,
        axis: "hospital_capacity",
        expectedSnippet: expectedSnippetForScenariosVaryingByHospitalCapacityWithNoneBehaviour,
      },
    ];

    testCases.forEach(({ description, scenarios, axis, expectedSnippet }) => {
      it(description, async () => {
        const component = await mountSuspended(CodeSnippet, {
          global: { stubs, plugins: [mockPinia({
            currentComparison: { axis },
            metadata: mockMetadataResponseData,
          }, false, { stubActions: false })] },
          props: { scenarios },
        });
        await component.find("button.btn-scenario-header").trigger("click");
        expect(component.findComponent(CModal).props("visible")).toBe(true);
        expect(component.findComponent(CModal).text()).toContain("the current scenarios");
        expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");
        expect(component.find("pre").text()).toBe(expectedSnippet);
      });
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
