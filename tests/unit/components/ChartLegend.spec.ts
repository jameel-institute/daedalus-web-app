import ChartLegend from "@/components/ChartLegend.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const items = [
  { label: "Item 1", shape: "rectangle", color: "rgb(0, 0, 100)" },
  { label: "Item 2", shape: "line", color: "rgba(0, 0, 100, 0.4)" },
];

describe("chart legend", () => {
  it("renders legend items correctly", async () => {
    const component = await mountSuspended(ChartLegend, {
      props: { items, rowHeightRem: 1 },
    });

    const legendItems = component.findAll(".legend-item");
    expect(legendItems.length).toBe(items.length);

    items.forEach((item, index) => {
      const legendItem = legendItems.at(index);
      expect(legendItem?.text()).toContain(item.label);
      expect(legendItem?.classes()).toContain(`legend-item-${item.shape}`);

      const icon = legendItem?.find("i");
      expect(icon?.attributes("style")).toContain(`background: ${item.color}`);
      if (item.shape === "rectangle") {
        expect(icon?.attributes("style")).toContain("height: 1rem");
        expect(icon?.attributes("style")).not.toContain("margin-top: 0.35rem");
      } else if (item.shape === "line") {
        expect(icon?.attributes("style")).toContain("height: 0.15rem");
        expect(icon?.attributes("style")).toContain("margin-top: 0.35rem");
      }
    });
  });
});
