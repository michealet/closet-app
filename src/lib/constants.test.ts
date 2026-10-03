import { describe, expect, it } from "vitest";
import {
  ALL_SEASONS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
} from "./constants";

describe("fixed lists", () => {
  it("follow the FRD order", () => {
    expect(CATEGORY_OPTIONS.map((o) => o.label)).toEqual([
      "Tops",
      "Bottoms",
      "Dresses",
      "Sets",
      "Jackets/Outerwear",
      "Shoes",
      "Bags",
      "Accessories",
      "Jewelry",
    ]);
    expect(SEASON_OPTIONS.map((o) => o.label)).toEqual([
      "Spring",
      "Summer",
      "Fall",
      "Winter",
    ]);
    expect(OCCASION_OPTIONS).toHaveLength(11);
    expect(COLOR_OPTIONS).toHaveLength(18);
  });

  it("have unique labels", () => {
    for (const options of [
      CATEGORY_OPTIONS,
      COLOR_OPTIONS,
      SEASON_OPTIONS,
      OCCASION_OPTIONS,
    ]) {
      const labels = options.map((o) => o.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("give every color a hex swatch except Multi/Pattern", () => {
    for (const { value, swatch } of COLOR_OPTIONS) {
      if (value === "multi_pattern") expect(swatch).toBeNull();
      else expect(swatch).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("treat All Season as every season", () => {
    expect(ALL_SEASONS).toEqual(["spring", "summer", "fall", "winter"]);
  });
});
