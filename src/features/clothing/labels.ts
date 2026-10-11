import {
  ALL_SEASONS,
  COLORS,
  NAME_MAX,
  SEASON_LABELS,
  type ClothingCategory,
  type ClothingColor,
  type Season,
} from "@/lib/constants";

/** "All Season" when all four are chosen, else the seasons in order. */
export function seasonsLabel(seasons: Season[]): string {
  if (ALL_SEASONS.every((season) => seasons.includes(season)))
    return "All Season";
  return ALL_SEASONS.filter((season) => seasons.includes(season))
    .map((season) => SEASON_LABELS[season])
    .join(", ");
}

/** Colors with their labels and swatches, in the item's order. */
export function colorDetails(colors: ClothingColor[]) {
  return colors.map((color) => ({ value: color, ...COLORS[color] }));
}

/** How a category reads inside a name ("Navy Zara dress"). */
const CATEGORY_NOUNS: Record<ClothingCategory, string> = {
  tops: "top",
  bottoms: "bottoms",
  dresses: "dress",
  sets: "set",
  jackets_outerwear: "jacket",
  shoes: "shoes",
  bags: "bag",
  accessories: "accessory",
  jewelry: "jewelry",
};

/**
 * A name made from an item's details (#36): up to two colors, the brand and
 * the category, e.g. "Navy & white Uniqlo top". Used when Name is left empty.
 */
export function suggestName({
  colors,
  brand,
  category,
}: {
  colors: ClothingColor[];
  brand: string | null | undefined;
  category: ClothingCategory;
}): string {
  const shades = colors
    .slice(0, 2)
    .map((color) =>
      color === "multi_pattern"
        ? "patterned"
        : COLORS[color].label.toLowerCase(),
    )
    .join(" & ");
  const name = [shades, brand?.trim(), CATEGORY_NOUNS[category]]
    .filter(Boolean)
    .join(" ")
    .slice(0, NAME_MAX)
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Tags are stored lowercase with single spaces (the database checks this). */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}
