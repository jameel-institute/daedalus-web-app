import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useScenarioStore } from "@/stores/scenario";

describe("scenario store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("actions", () => {
    it("initialises correctly", async () => {
      const store = useScenarioStore();
      expect(store.scenarios).toStrictEqual({});
    });

    it("can store, retrieve, and update a scenario", async () => {
      const store = useScenarioStore();
      const { getScenarioById } = storeToRefs(store);

      store.setScenario("123", {
        parameters: {
          disease: "chickenpox",
          hospitalWorkersPerCapita: 0.002,
        },
      });
      expect(getScenarioById.value("123")).toStrictEqual({
        parameters: {
          disease: "chickenpox",
          hospitalWorkersPerCapita: 0.002,
        },
      });

      store.setScenario("123", {
        parameters: {
          disease: "malaria",
          hospitalWorkersPerCapita: 0.002,
        },
      });
      expect(getScenarioById.value("123")).toStrictEqual({
        parameters: {
          disease: "malaria",
          hospitalWorkersPerCapita: 0.002,
        },
      });
    });
  });
});
