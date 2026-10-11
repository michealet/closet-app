import { expect, it } from "vitest";
import { colorDetails, seasonsLabel } from "./labels";

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
