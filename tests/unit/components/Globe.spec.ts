import type * as am5map from "@amcharts/amcharts5/map";
import Globe from "@/components/Globe.vue";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { mount } from "@vue/test-utils";
import { globeParameter, mockedMetadata, mockPinia, selectParameters, updatableNumericParameter } from "~/tests/unit/mocks/mockPinia";

// https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockRoute } = vi.hoisted(() => ({
  mockRoute: vi.fn(),
}));

mockNuxtImport("useRoute", () => mockRoute);

afterEach(() => {
  mockRoute.mockReset();
});

const getHighlightedCountrySeries = (chart: am5map.MapChart): am5map.MapSeries => {
  return chart.series._values.find(s => s._settings.layer === 26) as am5map.MapSeries;
};

describe("globe", () => {
  describe("on the scenarios new page", () => {
    beforeEach(() => {
      mockRoute.mockReturnValue({
        path: "/scenarios/new",
      });
    });

    it("initially creates the chart, with series whose layers are correct, without any 'highlighted country' series", async () => {
      const component = await mount(Globe);

      const chart = component.vm.chart;

      expect(chart.get("rotationX")).toBe(-100); // southEastAsiaXCoordinate
      expect(chart.get("rotationY")).toBe(-25); // amountToTiltTheEarthUpwardsBy - centroid.latitude

      expect(chart.series._values.length).toBe(8);
      expect(chart.series._values[0]._settings.layer).toBe(24); // Background series
      expect(chart.series._values[1]._settings.layer).toBe(24); // Antarctica
      expect(chart.series._values[2]._settings.layer).toBe(25); // Selectable countries
      expect(chart.series._values[3]._settings.layer).toBe(28); // Disputed land 1
      expect(chart.series._values[4]._settings.layer).toBe(28); // Disputed land 2
      expect(chart.series._values[5]._settings.layer).toBe(28); // Disputed land 3
      expect(chart.series._values[6]._settings.layer).toBe(28); // Disputed land 4
      expect(chart.series._values[7]._settings.layer).toBe(29); // Disputed bodies of water
    });

    it("updating highlightedCountry in store (as when a country is selected from the drop-down) should trigger a 'highlighted country' series to be added, which is disposed of when a new highlightedCountry is set", async () => {
      const globeParameterOptions = [
        { id: "GBR", label: "United Kingdom" },
        { id: "USA", label: "United States" },
      ];
      const testPinia = mockPinia({
        metadata: {
          ...mockedMetadata,
          parameters: [...selectParameters, { ...globeParameter, options: globeParameterOptions }, updatableNumericParameter],
        },
      });
      const appStore = useAppStore();
      const component = await mount(Globe, {
        global: { plugins: [testPinia] },
      });

      const chart = component.vm.chart;

      appStore.globe.highlightedCountry = "GBR";

      await nextTick();

      expect(chart.series._values.length).toBe(9);
      const highlightedSeries1 = getHighlightedCountrySeries(chart);

      // Ensure that the name has been updated from 'United Kingdom of Great Britain and Northern Ireland' to 'United Kingdom'
      // Name is used for tooltips.
      expect(highlightedSeries1._settings.geoJSON.properties.name).toBe("United Kingdom");

      const selectableCountrySeries = chart.series._values[2];

      // These expectations won't pass until the data has been validated by amcharts
      await waitFor(() => {
        expect(highlightedSeries1.mapPolygons._values[0]._dataItem?.dataContext?.name).toBe("United Kingdom");
        expect(selectableCountrySeries._dataItems.find(d => d.dataContext.id === "GBR").dataContext.name).toBe("United Kingdom");
        expect(selectableCountrySeries._dataItems.find(d => d.dataContext.id === "USA").dataContext.name).toBe("United States");
        expect(selectableCountrySeries._dataItems.find(d => d.dataContext.id === "THA").dataContext.name).toBe("Thailand");
      }, { timeout: 2000 });

      appStore.globe.highlightedCountry = "USA";

      await nextTick();

      await waitFor(() => {
        expect(highlightedSeries1._disposed).toBe(true);
      }, { timeout: 3000 /* >= geoPointZoomDuration */ });

      expect(chart.series._values.length).toBe(9);
      const highlightedSeries2 = getHighlightedCountrySeries(chart);
      expect(highlightedSeries2._settings.geoJSON.properties.name).toBe("United States");
      expect(highlightedSeries2.mapPolygons._values[0]._dataItem?.dataContext?.name).toBe("United States");
    });

    it("updating highlightedCountry in store (as when a country is selected from the drop-down) should trigger a recolouring of and a rotation to that country", async () => {
      const component = await mount(Globe, {
        global: { plugins: [mockPinia()] },
      });

      const chart = component.vm.chart;

      const appStore = useAppStore();
      appStore.globe.highlightedCountry = "GBR";

      await nextTick();

      expect(component.vm.gentleRotateAnimation.stopped).toBe(true);

      const gbrSeries = getHighlightedCountrySeries(chart);
      const originalColor = gbrSeries._settings.fill;

      await waitFor(() => {
        expect(gbrSeries._settings.fill).not.toBe(originalColor);
        expect(chart.get("rotationX")).toBeCloseTo(3, 0);
        expect(chart.get("rotationY")).toBeCloseTo(-29, 0);
      }, { timeout: 2500 /* >= rotateDuration */ });
    });

    it("updating scenarioCountry in store (as when a country selection is actually submitted, or a results page is loaded) triggers a rotation and a zoom to the country", async () => {
      const testPinia = mockPinia({
        metadata: {
          ...mockedMetadata,
          parameters: [...selectParameters, { ...globeParameter, id: "country" }, updatableNumericParameter],
        },
      });

      const component = await mount(Globe, {
        global: { plugins: [testPinia] },
      });

      const chart = component.vm.chart;
      expect(chart._settings.zoomLevel).toBe(1);

      const zoomToGeoBoundsSpy = vi.spyOn(chart, "zoomToGeoBounds");

      const appStore = useAppStore();
      appStore.currentScenario.parameters = { country: "NOR" };

      await nextTick();

      await waitFor(() => {
        expect(chart.get("rotationX")).toBeCloseTo(-12, 0);
        expect(chart.get("rotationY")).toBeCloseTo(-39, 0);
        expect(zoomToGeoBoundsSpy).toHaveBeenCalled();
      }, { timeout: 2500 /* >= rotateDuration */ });
    });

    it("zooms back out and re-starts the gentle rotation animation when the user navigates back to the new scenario page", async () => {
      const testPinia = mockPinia({
        metadata: {
          ...mockedMetadata,
          parameters: [...selectParameters, { ...globeParameter, id: "country" }, updatableNumericParameter],
        },
      });

      const component = await mount(Globe, {
        global: { plugins: [testPinia] },
      });

      const chart = component.vm.chart;

      const zoomToGeoBoundsSpy = vi.spyOn(chart, "zoomToGeoBounds");
      const goHomeSpy = vi.spyOn(chart, "goHome");

      const appStore = useAppStore();
      appStore.currentScenario.parameters = { country: "NOR" };

      await nextTick();

      await waitFor(() => {
        expect(chart.get("rotationX")).toBeCloseTo(-12, 0);
        expect(chart.get("rotationY")).toBeCloseTo(-39, 0);
        expect(zoomToGeoBoundsSpy).toHaveBeenCalled();
      }, { timeout: 2500 /* >= rotateDuration */ });

      // Simulate the changes to app store that are performed by the 'scenarios/new' page's onMounted hook
      appStore.globe.interactive = false;
      appStore.globe.highlightedCountry = null;

      await nextTick();

      expect(component.vm.gentleRotateAnimation.stopped).toBe(false);
      await waitFor(() => {
        expect(goHomeSpy).toHaveBeenCalled();
      });
    });
  });

  describe("on the results page", () => {
    beforeEach(() => {
      mockRoute.mockReturnValue({
        path: "/scenarios/1",
      });
    });

    it("updating highlightedCountry in store (as when a country is selected from the drop-down) should not trigger a rotation to that country", async () => {
      const component = await mount(Globe, {
        global: { plugins: [mockPinia()] },
      });

      const chart = component.vm.chart;

      const appStore = useAppStore();
      appStore.globe.highlightedCountry = "GBR";

      await nextTick();

      const gbrSeries = getHighlightedCountrySeries(chart);
      const originalColor = gbrSeries._settings.fill;
      const originalX = chart.get("rotationX");
      const originalY = chart.get("rotationY");

      await waitFor(() => {
        expect(gbrSeries._settings.fill).not.toBe(originalColor);
        expect(gbrSeries._settings.fill._hex).toBe(3645343); // This is the decimal version of the hex for 'Imperial sea-glass'
        expect(chart.get("rotationX")).toBe(originalX);
        expect(chart.get("rotationY")).toBe(originalY);
      }, { timeout: 3000 });
    });
  });
});
