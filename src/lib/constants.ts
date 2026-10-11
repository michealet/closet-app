import { Constants, type Database } from "@/types/database";

/**
 * Fixed lists from the FRD (§5, §8), backed by Postgres enums. Values and
 * their order come from the generated types; labels live here. Each label map
 * is a `Record` over the enum, so the build fails if the database gains or
 * loses a value that isn't labelled here.
 */

type Enums = Database["public"]["Enums"];
export type ClothingCategory = Enums["clothing_category"];
export type ClothingColor = Enums["clothing_color"];
export type Season = Enums["season"];
export type Occasion = Enums["occasion"];

const DB = Constants.public.Enums;

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  sets: "Sets",
  jackets_outerwear: "Jackets/Outerwear",
  shoes: "Shoes",
  bags: "Bags",
  accessories: "Accessories",
  jewelry: "Jewelry",
};

/**
 * Swatches are product data (the color of the clothing), not theme colors,
 * so they're the one place hex values are allowed. `null` = show a pattern.
 */
export const COLORS: Record<
  ClothingColor,
  { label: string; swatch: string | null }
> = {
  black: { label: "Black", swatch: "#1a1a1a" },
  white: { label: "White", swatch: "#ffffff" },
  cream: { label: "Cream", swatch: "#f3ead8" },
  beige: { label: "Beige", swatch: "#d9c4a5" },
  brown: { label: "Brown", swatch: "#7a5134" },
  gray: { label: "Gray", swatch: "#9a9a9a" },
  navy: { label: "Navy", swatch: "#1f2c4c" },
  blue: { label: "Blue", swatch: "#4a7bc0" },
  green: { label: "Green", swatch: "#4f8a5b" },
  olive: { label: "Olive", swatch: "#6b6b3a" },
  yellow: { label: "Yellow", swatch: "#e8c94a" },
  orange: { label: "Orange", swatch: "#e08a3c" },
  red: { label: "Red", swatch: "#c23b3b" },
  pink: { label: "Pink", swatch: "#e9a3b5" },
  purple: { label: "Purple", swatch: "#7d5aa6" },
  gold: { label: "Gold", swatch: "#c9a646" },
  silver: { label: "Silver", swatch: "#c0c3c7" },
  multi_pattern: { label: "Multi/Pattern", swatch: null },
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

/** "All Season" in the UI selects every season. */
export const ALL_SEASONS: readonly Season[] = DB.season;

export const OCCASION_LABELS: Record<Occasion, string> = {
  casual: "Casual",
  class: "Class",
  going_out: "Going Out",
  dinner: "Dinner",
  formal: "Formal",
  work: "Work",
  vacation: "Vacation",
  date_night: "Date Night",
  party: "Party",
  workout: "Workout",
  other: "Other",
};

/** Options in the FRD's order, ready for chips, selects and filters. */
export const CATEGORY_OPTIONS = DB.clothing_category.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const COLOR_OPTIONS = DB.clothing_color.map((value) => ({
  value,
  ...COLORS[value],
}));

export const SEASON_OPTIONS = DB.season.map((value) => ({
  value,
  label: SEASON_LABELS[value],
}));

export const OCCASION_OPTIONS = DB.occasion.map((value) => ({
  value,
  label: OCCASION_LABELS[value],
}));

/** Limits that mirror database check constraints. */
export const NAME_MAX = 100;
export const BRAND_MAX = 80;
export const NOTES_MAX = 500;
export const EVENT_NAME_MAX = 100;
export const TAG_MAX = 30;
export const TAGS_MAX = 20;
