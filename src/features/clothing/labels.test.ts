import { expect, it } from "vitest";
import {
  colorDetails,
  normalizeTag,
  seasonsLabel,
  suggestName,
} from "./labels";

it("names all four seasons All Season", () => {
  expect(seasonsLabel(["winter", "spring", "fall", "summer"])).toBe(
    "All Season",
  );
});

it("lists some seasons in calendar order", () => {
  expect(seasonsLabel(["winter", "spring"])).toBe("Spring, Winter");
  expect(seasonsLabel([])).toBe("");
});

it("adds labels and swatches to colors", () => {
  expect(colorDetails(["navy", "multi_pattern"])).toEqual([
    { value: "navy", label: "Navy", swatch: "#1f2c4c" },
    { value: "multi_pattern", label: "Multi/Pattern", swatch: null },
  ]);
});

it("suggests a name from colors, brand and category (#36)", () => {
  expect(
    suggestName({ colors: ["navy"], brand: "Zara", category: "dresses" }),
  ).toBe("Navy Zara dress");
  expect(
    suggestName({
      colors: ["black", "white", "red"],
      brand: null,
      category: "tops",
    }),
  ).toBe("Black & white top");
  expect(
    suggestName({
      colors: ["multi_pattern"],
      brand: "uniqlo",
      category: "bottoms",
    }),
  ).toBe("Patterned uniqlo bottoms");
  expect(suggestName({ colors: [], brand: " ", category: "shoes" })).toBe(
    "Shoes",
  );
  expect(
    suggestName({
      colors: ["navy"],
      brand: "x".repeat(80),
      category: "jackets_outerwear",
    }).length,
  ).toBeLessThanOrEqual(100);
});

it("normalizes tags", () => {
  expect(normalizeTag("  Wedding   Guest ")).toBe("wedding guest");
});
