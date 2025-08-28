import ScenariosIdPage from "@/pages/scenarios/[runId].vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";

const stubs = {
  "CIcon": true,
  "TimeSeries.client": true,
  "CostsCard": true,
};

const longRunningRunId = "123";
const failedRunId = "456";
const successfulRunId = "789";
const plugins = [mockPinia({
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
}, false, { stubActions: false })];

// https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockRoute } = vi.hoisted(() => ({
  mockRoute: vi.fn(),
}));

mockNuxtImport("useRoute", () => mockRoute);

afterEach(() => {
  mockRoute.mockReset();
});

registerEndpoint(`/api/scenarios/${successfulRunId}/details`, () => {
  return {
    parameters: mockResultData.parameters,
    runId: successfulRunId,
  };
});

registerEndpoint(`/api/scenarios/${longRunningRunId}/status`, () => {
  return {
    runStatus: "running",
    runSuccess: null,
    done: false,
    runErrors: null,
    runId: longRunningRunId,
  };
});

registerEndpoint(`/api/scenarios/${failedRunId}/status`, () => {
  return {
    runStatus: "failed",
    runSuccess: false,
    done: true,
    runErrors: ["No biscuits available. Analysis lost motivation."],
    runId: failedRunId,
  };
});

registerEndpoint(`/api/scenarios/${successfulRunId}/status`, () => {
  return {
    runStatus: "complete",
    runSuccess: true,
    done: true,
    runErrors: null,
    runId: successfulRunId,
  };
});

registerEndpoint(`/api/scenarios/${successfulRunId}/result`, () => {
  return mockResultData;
});

beforeAll(async () => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("scenario result page", () => {
  it("renders as expected", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: successfulRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("Change parameters");

    await waitFor(() => {
      expect(component.text()).toContain("United Kingdom");
      expect(component.text()).toContain("SARS 2004");
      expect(component.text()).toContain("30,500");
      expect(component.text()).toContain("No closures");
      expect(component.text()).toContain("None");
    });
  });

  it("resets appStore.downloadError when the page is loaded", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: successfulRunId,
      },
    });
    const piniaMock = mockPinia({
      downloadError: "Some error",
    }, true, { stubActions: false });

    await mountSuspended(ScenariosIdPage, {
      global: {
        stubs,
        plugins: [piniaMock],
      },
    });

    const appStore = useAppStore(piniaMock);
    expect(appStore.downloadError).toBeUndefined();
  });

  // Also end-to-end tested in tests/e2e/slowAnalysis.spec.ts
  it("shows alerts when analysis is taking a long time and when it is taking a really long time", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: longRunningRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(true);
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(spinner.isVisible()).toBe(true);

    vi.advanceTimersByTime(11000);
    await nextTick();
    // This alert text should be displayed after a further 10 seconds of waiting.
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(spinner.isVisible()).toBe(true);
  });

  it("shows alerts when analysis fails", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: failedRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(false);
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).toContain("No biscuits available.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);

    vi.advanceTimersByTime(11000);
    await nextTick();
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);
  });

  it("shows no alerts when analysis succeeds", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: successfulRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    const spinner = component.findComponent({ name: "CSpinner" });
    // Two nextTicks are needed to wait for the spinner to disappear: status fetch and result fetch.
    await waitFor(() => {
      expect(spinner.isVisible()).toBe(false);
    });
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);

    vi.advanceTimersByTime(11000);
    await nextTick();
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);
  });

  it("opens the code snippet when the link from the advanced usage popover in the 'CreateComparison' modal is clicked", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: successfulRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    await waitFor(() => {
      expect(component.text()).toContain("Compare against other scenarios");
      expect(component.text()).not.toContain("Use this R code snippet");
    });

    const createComparisonModalSelector = "[aria-labelledby='chooseAxisModalTitle']";
    await component.findAll("button").find(b => b.text() === "Compare against other scenarios")!.trigger("click");
    const countryButton = component
      .find(createComparisonModalSelector)
      .find("#axisOptions")
      .findAll("button")[0];
    await countryButton.trigger("click");
    const popoverContainer = component.find("#advanced-usage-popover-container");
    await popoverContainer.findAll("p").find(p => p.text() === "Advanced usage")!.trigger("click");
    vi.advanceTimersByTime(1);
    await nextTick();

    await component.find("#showRCode").trigger("click");

    expect(component.find(createComparisonModalSelector).exists()).toBe(false);
    expect(component.text()).toContain("Use this R code snippet");
  });

  it("opens the code snippet when the link from the advanced usage popover in the 'EditParameters' modal is clicked", async () => {
    mockRoute.mockReturnValue({
      params: {
        runId: successfulRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    await waitFor(() => {
      expect(component.text()).toContain("Change parameters");
      expect(component.text()).not.toContain("Use this R code snippet");
    });

    const editParamsModalTitleSelector = "#editParamsModalTitle";
    expect(document.body.querySelector(editParamsModalTitleSelector)).toBeNull();

    const editParametersModalButton = component.findAllComponents({ name: "CButton" }).find(b => b.text() === "Change parameters");
    await editParametersModalButton!.trigger("click");

    // Modal is teleported out of component to document body.
    expect(document.body.querySelector(editParamsModalTitleSelector)).not.toBeNull();

    const popoverContainer = document.body.querySelector("#advanced-usage-popover-container");
    expect(popoverContainer!.classList).toContain("d-flex");
    expect(popoverContainer!.classList).not.toContain("d-none");
    popoverContainer!.querySelector(".trigger")!.dispatchEvent(new MouseEvent("click"));

    vi.advanceTimersByTime(1);
    await nextTick();

    popoverContainer!.querySelector("#showRCode")!.dispatchEvent(new MouseEvent("click"));

    await nextTick();

    expect(document.body.querySelector(editParamsModalTitleSelector)).toBeNull();
    expect(component.text()).toContain("Use this R code snippet");
  });
});
