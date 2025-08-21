import { setActivePinia } from "pinia";
import { mockPinia } from "../mocks/mockPinia";

describe("useTimeSeriesGroups", () => {
  it("should return the correct active role and active time series metadata", () => {
    setActivePinia(mockPinia());

    const isDaily = ref(true);
    const timeSeriesGroup = ref({
      id: "hospitalisations",
      label: "Hospitalisations",
      time_series: {
        total: "hospitalised",
        daily: "new_hospitalised",
      },
    });
    const { activeRole, activeSeriesMetadata } = useTimeSeriesGroups(timeSeriesGroup, isDaily);

    expect(activeRole.value).toBe("daily");
    expect(activeSeriesMetadata.value).toEqual({
      id: "new_hospitalised",
      label: "New hospitalisations",
      description: "Number of new patients in need of hospitalisation per day",
    });

    isDaily.value = false;
    expect(activeRole.value).toBe("total");
    expect(activeSeriesMetadata.value).toEqual({
      id: "hospitalised",
      label: "Hospital demand",
      description: "Infections requiring hospitalisation",
    });
  });
});
