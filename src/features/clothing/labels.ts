import {
  ALL_SEASONS,
  COLORS,
  SEASON_LABELS,
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
