import Legend from "~/components/Charts/Legend.client.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const items = [
  { label: "Item 1", shape: "rectangle", color: "rgb(0, 0, 100)" },
  { label: "Item 2", shape: "line", color: "rgba(0, 0, 100, 0.4)" },
  { label: "Item 3", shape: "circle", color: "rgb(100, 0, 0)" },
  { label: "Item 4", shape: "squareDash", color: "rgb(0, 100, 0)" },
];

describe("chart legend", () => {
  it("renders legend items correctly", async () => {
    const component = await mountSuspended(Legend, {
      props: { items, rowHeightRem: 1 },
    });

    const legendItems = component.findAll(".legend-item");
    expect(legendItems.length).toBe(items.length);

    items.forEach((item, index) => {
      const legendItem = legendItems.at(index);
      expect(legendItem!.text()).toContain(item.label);
      expect(legendItem!.classes()).toContain(`legend-item`);

      const icon = legendItem!.find("i");
      const svg = legendItem!.find("svg");
      if (item.shape === "rectangle") {
        expect(legendItem!.findAll("svg")).toHaveLength(0);
        expect(icon?.attributes("style")).toContain(`background: ${item.color}`);
        expect(icon?.attributes("style")).toContain("height: 1rem");
        expect(icon?.attributes("style")).toContain("width: 38px");
      } else if (item.shape === "line") {
        expect(legendItem!.findAll("svg")).toHaveLength(0);
        expect(icon?.attributes("style")).toContain(`background: ${item.color}`);
        expect(icon?.attributes("style")).toContain("height: 0.15rem");
        expect(icon?.attributes("style")).toContain("margin-top: 0.425rem");
        expect(icon?.attributes("style")).toContain("width: 38px");
      } else if (item.shape === "circle") {
        expect(legendItem!.findAll("svg")).toHaveLength(0);
        expect(icon?.attributes("style")).toContain(`background: ${item.color}`);
        expect(icon?.attributes("style")).toContain("border-radius: 50%");
        expect(icon?.attributes("style")).toContain("height: 11px");
      } else if (item.shape === "squareDash") {
        expect(legendItem!.findAll("i")).toHaveLength(0);
        expect(svg?.attributes("width")).toBe("38");
        expect(svg?.attributes("height")).toBe("2");
        expect(svg?.attributes("style")).toContain("margin-top: 0.425rem");
        const path = svg?.find("path");
        expect(path?.attributes("stroke")).toBe(item.color);
        expect(path?.attributes("d")).toContain("38");
        expect(path?.attributes("stroke-dasharray")).toBe("2,2");
      }
    });
  });
});
