import {
  createRotateAnimation,
  getWideGeoBounds,
  handlePolygonActive,
  pauseAnimations,
  removeSeries,
  rotateToCentroid,
} from "@/components/utils/globe";
import * as am5map from "@amcharts/amcharts5/map";

describe("pauseAnimations", () => {
  it("should pause animations passed to it, unless they have been stopped", () => {
    const stoppedAnimation = { pause: vi.fn(), stopped: true, play: vi.fn() };
    const unstoppedAnimation = { pause: vi.fn(), stopped: false, play: vi.fn() };
    pauseAnimations([stoppedAnimation, unstoppedAnimation]);
    expect(stoppedAnimation.pause).not.toHaveBeenCalled();
    expect(unstoppedAnimation.pause).toHaveBeenCalled();
  });
});

describe("rotateToCentroid", () => {
  it("should rotate the chart to the centroid", async () => {
    const chart = { animate: vi.fn(), get: vi.fn().mockReturnValue(0) } as unknown as am5map.MapChart;
    const centroid = { longitude: 100, latitude: 50 };
    const rotatedToCountryRef = ref("");
    await rotateToCentroid(chart, centroid, "XYZ", rotatedToCountryRef);
    expect(chart.animate).toHaveBeenCalledTimes(2);
    expect(chart.animate).toHaveBeenNthCalledWith(1, expect.objectContaining({
      key: "rotationX",
      to: -100,
    }));
    expect(chart.animate).toHaveBeenNthCalledWith(2, expect.objectContaining({
      key: "rotationY",
      to: -25, // amountToTiltTheEarthUpwardsBy - centroid.latitude
    }));

    expect(rotatedToCountryRef.value).toBe("XYZ");
  });
});

describe("removeSeries", () => {
  it("should remove and dispose the series", () => {
    const seriesToRemove = {} as am5map.MapPolygonSeries;
    const disposeFn = vi.fn();
    const chart = {
      series: {
        indexOf: vi.fn().mockReturnValue(0),
        removeIndex: vi.fn().mockReturnValue({ dispose: disposeFn }),
      },
    } as unknown as am5map.MapChart;
    removeSeries(chart, seriesToRemove);
    expect(disposeFn).toHaveBeenCalled();
  });
});

describe("createRotateAnimation", () => {
  it("should create a rotate animation when the current rotationX is 0", () => {
    const chart = { animate: vi.fn(), get: vi.fn().mockReturnValue(0) } as unknown as am5map.MapChart;
    createRotateAnimation(chart);
    expect(chart.animate).toHaveBeenCalledWith(expect.objectContaining({
      key: "rotationX",
      from: 0,
      to: 360,
      loops: Infinity,
    }));
  });

  it("should create a rotate animation when the current rotationX is not 0", () => {
    const chart = { animate: vi.fn(), get: vi.fn().mockReturnValue(30) } as unknown as am5map.MapChart;
    createRotateAnimation(chart);
    expect(chart.animate).toHaveBeenCalledWith(expect.objectContaining({
      key: "rotationX",
      from: 30,
      to: 390,
      loops: Infinity,
    }));
  });
});

describe("handlePolygonActive", () => {
  it("when there is a previous polygon which differs from the current one (the 'target'), it should deactivate the previous polygon and assign the current one to the previous polygon ref", () => {
    const target = { set: vi.fn(), uid: 1 } as unknown as am5map.MapPolygon;
    const setFn = vi.fn();
    const prevPolygonRef = ref({ set: setFn, uid: 2 } as unknown as am5map.MapPolygon) as Ref<am5map.MapPolygon>;
    handlePolygonActive(target, prevPolygonRef);
    expect(setFn).toHaveBeenCalledWith("active", false);
    expect(prevPolygonRef.value.uid).toBe(1);
  });

  it("when there is no previous polygon, it should assign the current one to the previous polygon ref", () => {
    const target = { set: vi.fn() } as unknown as am5map.MapPolygon;
    const prevPolygonRef = ref<am5map.MapPolygon | undefined>(undefined) as Ref<undefined>;
    handlePolygonActive(target, prevPolygonRef);
    expect(prevPolygonRef.value).toStrictEqual(target);
  });
});

describe("getWideGeoBounds", () => {
  it("should return the bounds with padding", () => {
    const geometry = {} as GeoJSON.GeometryObject;
    const bounds = { left: -170, right: 170, top: 80, bottom: -80 };
    vi.spyOn(am5map, "getGeoBounds").mockReturnValue(bounds);
    const result = getWideGeoBounds(geometry);
    expect(result.left).toBe(-180);
    expect(result.right).toBe(180);
    expect(result.top).toBe(90);
    expect(result.bottom).toBe(-90);
  });

  it("should return the padded bounds without exceeding any of the global bounds", () => {
    const geometry = {} as GeoJSON.GeometryObject;
    const bounds = { left: -175, right: 170, top: 80, bottom: -85 };
    vi.spyOn(am5map, "getGeoBounds").mockReturnValue(bounds);
    const result = getWideGeoBounds(geometry);
    expect(result.left).toBe(-180);
    expect(result.right).toBe(180);
    expect(result.top).toBe(90);
    expect(result.bottom).toBe(-90);
  });
});
