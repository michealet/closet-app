import { expect, it } from "vitest";
import {
  isOutfitFiltered,
  outfitsHref,
  parseOutfitFilters,
} from "./outfit-filters";

it("reads Favorites, Occasion and Season from the URL", () => {
  expect(
    parseOutfitFilters({ favorites: "1", occasion: "dinner", season: "fall" }),
  ).toEqual({ favorites: true, occasion: "dinner", season: "fall" });
});

it("ignores unknown or repeated values", () => {
  const filters = parseOutfitFilters({
    favorites: "yes",
    occasion: "opera",
    season: ["winter", "fall"],
  });
  expect(filters).toEqual({
    favorites: false,
    occasion: null,
    season: "winter",
  });
  expect(isOutfitFiltered(parseOutfitFilters({}))).toBe(false);
});

it("builds links that keep the other filters", () => {
  const filters = { favorites: true, occasion: "work", season: null } as const;
  expect(outfitsHref(filters)).toBe("/outfits?favorites=1&occasion=work");
  expect(outfitsHref({ ...filters, favorites: false, occasion: null })).toBe(
    "/outfits",
  );
});
