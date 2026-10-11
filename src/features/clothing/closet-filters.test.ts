import { expect, it } from "vitest";
import {
  NO_FILTERS,
  filtersToQuery,
  isFiltered,
  parseFilters,
  searchFilter,
} from "./closet-filters";

it("reads known filters and ignores unknown or oversized values", () => {
  expect(
    parseFilters({
      q: "  linen ",
      category: "tops",
      color: ["navy", "red"],
      season: "monsoon",
      brand: "x".repeat(81),
      tag: "Thrifted",
      favorites: "1",
      sort: "name",
    }),
  ).toEqual({
    q: "linen",
    category: "tops",
    color: "navy",
    season: null,
    brand: null,
    tag: "thrifted",
    favorites: true,
    sort: "name",
  });
  expect(parseFilters({})).toEqual(NO_FILTERS);
});

it("round-trips through the URL, leaving out defaults", () => {
  const filters = {
    ...NO_FILTERS,
    q: "summer dress",
    brand: "H&M",
    tag: "wedding guest",
  };
  const query = filtersToQuery(filters);
  expect(query).toBe("?q=summer+dress&brand=H%26M&tag=wedding+guest");
  expect(
    parseFilters(Object.fromEntries(new URLSearchParams(query.slice(1)))),
  ).toEqual(filters);
  expect(filtersToQuery(NO_FILTERS)).toBe("");
});

it("treats sort alone as unfiltered", () => {
  expect(isFiltered({ ...NO_FILTERS, sort: "name" })).toBe(false);
  expect(isFiltered({ ...NO_FILTERS, favorites: true })).toBe(true);
});

it("searches text fields, matching color labels and the user's tags", () => {
  expect(searchFilter("blu", ["blue jeans day", "linen"])).toBe(
    'name.ilike.*blu*,brand.ilike.*blu*,notes.ilike.*blu*,colors.ov.{blue},tags.ov.{"blue jeans day"}',
  );
  expect(searchFilter("   ", [])).toBeNull();
});

it("strips characters that would break the filter", () => {
  expect(searchFilter('a,b)(c"%*', [])).toBe(
    "name.ilike.*a b c*,brand.ilike.*a b c*,notes.ilike.*a b c*",
  );
});
