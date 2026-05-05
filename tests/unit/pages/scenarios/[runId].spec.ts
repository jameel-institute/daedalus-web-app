import ScenariosIdPage from "@/pages/scenarios/[runId].vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";

const stubs = {
  "CIcon": true,
  "TimeSeries.client": true,
  "CostsPanel": true,
};

const successfulRunId = "789";
const sampleScenario = {
  ...emptyScenario,
  parameters: mockResultData.parameters,
};
const plugins = [mockPinia({
  currentScenario: sampleScenario,
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
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("scenario result page", () => {

    const completeRunId = "135";
    registerEndpoint(`/api/scenarios/${completeRunId}/status`, () => {
      return {
        runStatus: "complete",
        runSuccess: true,
        done: true,
        runErrors: null,
        runId: completeRunId,
      };
    });
    registerEndpoint(`/api/scenarios/${completeRunId}/result`, () => {
      return mockResultData;
    });
    registerEndpoint(`/api/scenarios/${completeRunId}/details`, () => {
      return {
        parameters: mockResultData.parameters,
        runId: completeRunId,
      };
    });

    mockRoute.mockReturnValue({ params: { runId: completeRunId } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("Change parameters");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
    expect(component.text()).toContain("United Kingdom");
    expect(component.text()).toContain("SARS 2004");
    expect(component.text()).toContain("30,500");
    expect(component.text()).toContain("No closures");
    expect(component.text()).toContain("None");
  });

  it("renders as expected if scenario status is still in progress at pageload time", async () => {
    const pendingRunId = "246";
    let statusRequestCounts = 0;
    registerEndpoint(`/api/scenarios/${pendingRunId}/status`, () => {
      statusRequestCounts++;
      const nowComplete = statusRequestCounts === 2;
      return {
        runStatus: nowComplete ? "running" : "complete",
        runSuccess: nowComplete ? "true" : null,
        done: nowComplete,
        runErrors: null,
        runId: pendingRunId,
      };
    });
    registerEndpoint(`/api/scenarios/${pendingRunId}/result`, () => {
      return mockResultData;
    });
    registerEndpoint(`/api/scenarios/${pendingRunId}/details`, () => {
      return {
        parameters: mockResultData.parameters,
        runId: pendingRunId,
      };
    });

    mockRoute.mockReturnValue({ params: { runId: pendingRunId } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("Change parameters");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);

    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
      expect(component.text()).toContain("United Kingdom");
      expect(component.text()).toContain("SARS 2004");
      expect(component.text()).toContain("30,500");
      expect(component.text()).toContain("No closures");
      expect(component.text()).toContain("None");
    });
  });

  it("shows alert when run is taking a long time", async () => {
    const longRunningRunId = "123";
    registerEndpoint(`/api/scenarios/${longRunningRunId}/status`, () => {
      return {
        runStatus: "running",
        runSuccess: null,
        done: false,
        runErrors: null,
        runId: longRunningRunId,
      };
    });

    mockRoute.mockReturnValue({
      params: {
        runId: longRunningRunId,
      },
    });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(true);
    expect(component.text()).not.toContain("Thank you for waiting.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(true);
  });

  it("resets appStore.downloadError and any previous scenario runs when the page is loaded", async () => {
    mockRoute.mockReturnValue({ params: { runId: successfulRunId } });
    const piniaMock = mockPinia({
      downloadError: "Some error",
      currentComparison: {
        axis: "response",
        baseline: "none",
        scenarios: [sampleScenario, sampleScenario],
      },
      metadata: mockMetadataResponseData as Metadata,
    }, true, { stubActions: false });

    await mountSuspended(ScenariosIdPage, {
      global: {
        stubs,
        plugins: [piniaMock],
      },
    });

    const appStore = useAppStore(piniaMock);
    expect(appStore.downloadError).toBeUndefined();
    expect(appStore.currentScenario.parameters).not.toBeUndefined();
    expect(appStore.currentComparison.axis).toBeUndefined();
    expect(appStore.currentComparison.baseline).toBeUndefined();
    expect(appStore.currentComparison.scenarios).toHaveLength(0);
  });

  it("shows alert when a status request throws an error during page setup script", async () => {
    const idForErroringStatusRequests = "123";
    registerEndpoint(`/api/scenarios/${idForErroringStatusRequests}/status`, () => {
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });
    mockRoute.mockReturnValue({ params: { runId: idForErroringStatusRequests } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("refresh the page");
    expect(component.text()).toContain("418");
    expect(component.text()).toContain("I'm a teapot");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows alert when a result request throws an error during page setup script", async () => {
    const idForErroringResultRequest = "468";
    registerEndpoint(`/api/scenarios/${idForErroringResultRequest}/status`, () => {
      return {
        runStatus: "complete",
        runSuccess: true,
        done: true,
        runErrors: null,
        runId: idForErroringResultRequest,
      };
    });
    registerEndpoint(`/api/scenarios/${idForErroringResultRequest}/result`, () => {
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });
    mockRoute.mockReturnValue({ params: { runId: idForErroringResultRequest } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("refresh the page");
    expect(component.text()).toContain("418");
    expect(component.text()).toContain("I'm a teapot");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows alert when a status request throws an error during polling", async () => {
    const statusRequestFirstPendingThenError = "357";
    let statusRequestCounts = 0;
    registerEndpoint(`/api/scenarios/${statusRequestFirstPendingThenError}/status`, () => {
      statusRequestCounts++;
      if (statusRequestCounts < 2) {
        return {
          runStatus: "running",
          runSuccess: null,
          done: false,
          runErrors: null,
          runId: statusRequestFirstPendingThenError,
        };
      }
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });
    registerEndpoint(`/api/scenarios/${statusRequestFirstPendingThenError}/result`, () => {
      return mockResultData;
    });
    mockRoute.mockReturnValue({ params: { runId: statusRequestFirstPendingThenError } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);

    vi.advanceTimersByTime(500);
    await flushPromises();

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("refresh the page");
    expect(component.text()).toContain("418");
    expect(component.text()).toContain("I'm a teapot");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows alert when a result request throws an error after page has loaded", async () => {
    const idForResultRequestErroringAfterPageload = "468";
    let statusRequestCounts = 0;
    registerEndpoint(`/api/scenarios/${idForResultRequestErroringAfterPageload}/status`, () => {
      statusRequestCounts++;
      const nowComplete = statusRequestCounts === 2;
      return {
        runStatus: nowComplete ? "running" : "complete",
        runSuccess: nowComplete ? "true" : null,
        done: nowComplete,
        runErrors: null,
        runId: idForResultRequestErroringAfterPageload,
      };
    });
    registerEndpoint(`/api/scenarios/${idForResultRequestErroringAfterPageload}/result`, () => {
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });

    mockRoute.mockReturnValue({ params: { runId: idForResultRequestErroringAfterPageload } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);

    vi.advanceTimersByTime(500);
    await flushPromises();

    await waitFor(() => {
      expect(component.text()).toContain("There was an unexpected error");
      expect(component.text()).toContain("refresh the page");
      expect(component.text()).toContain("418");
      expect(component.text()).toContain("I'm a teapot");
      expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
    });
  });

  it("shows alerts when run fails (i.e. the API reports errors in the model run)", async () => {
    const failedRunId = "456";
    registerEndpoint(`/api/scenarios/${failedRunId}/status`, () => {
      return {
        runStatus: "failed",
        runSuccess: false,
        done: true,
        runErrors: ["No biscuits available. Scenario lost motivation."],
        runId: failedRunId,
      };
    });

    mockRoute.mockReturnValue({ params: { runId: failedRunId } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("try again later");
    expect(component.text()).toContain("No biscuits available.");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows no spinner when run succeeds", async () => {
    mockRoute.mockReturnValue({ params: { runId: successfulRunId } });

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("opens the code snippet when the link from the advanced usage popover in the 'CreateComparison' modal is clicked", async () => {
    mockRoute.mockReturnValue({ params: { runId: successfulRunId } });

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
    mockRoute.mockReturnValue({ params: { runId: successfulRunId } });

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
