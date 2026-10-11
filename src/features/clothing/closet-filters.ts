/**
 * Closet search, filters and sort (FRD CL-2–CL-4, CL-6). They live in the
 * URL (`/closet?q=…&color=navy`), so links, reloads and Back keep them.
 * Pure functions, safe in server and browser code.
 */

import {
  BRAND_MAX,
  COLOR_OPTIONS,
  TAG_MAX,
  type ClothingCategory,
  type ClothingColor,
  type Season,
} from "@/lib/constants";
import { Constants } from "@/types/database";

export type ClosetSort = "newest" | "name";

export type ClosetFilters = {
  q: string;
  category: ClothingCategory | null;
  color: ClothingColor | null;
  season: Season | null;
  brand: string | null;
  tag: string | null;
  favorites: boolean;
  sort: ClosetSort;
};

export const NO_FILTERS: ClosetFilters = {
  q: "",
  category: null,
  color: null,
  season: null,
  brand: null,
  tag: null,
  favorites: false,
  sort: "newest",
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(values: readonly T[], value: string) {
  return (values as readonly string[]).includes(value) ? (value as T) : null;
}

/** Reads filters from search params, ignoring anything unknown or too long. */
export function parseFilters(params: Params): ClosetFilters {
  const enums = Constants.public.Enums;
  const brand = first(params.brand);
  const tag = first(params.tag).toLowerCase();
  return {
    q: first(params.q).slice(0, 100),
    category: oneOf(enums.clothing_category, first(params.category)),
    color: oneOf(enums.clothing_color, first(params.color)),
    season: oneOf(enums.season, first(params.season)),
    brand: brand && brand.length <= BRAND_MAX ? brand : null,
    tag: tag && tag.length <= TAG_MAX ? tag : null,
    favorites: first(params.favorites) === "1",
    sort: first(params.sort) === "name" ? "name" : "newest",
  };
}

/** The query string for `filters`, leaving out defaults. */
export function filtersToQuery(filters: ClosetFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.color) params.set("color", filters.color);
  if (filters.season) params.set("season", filters.season);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.favorites) params.set("favorites", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** True when search or any filter narrows the closet (sort doesn't). */
export function isFiltered(filters: ClosetFilters): boolean {
  return filtersToQuery({ ...filters, sort: "newest" }) !== "";
}

/** Characters that would break a PostgREST `or` filter or act as wildcards. */
const UNSAFE = /[,()"\\%*]/g;

/**
 * The PostgREST `or` filter for search (CL-2): name, brand or notes contain
 * the text, or a color label / one of the user's `tags` contains it.
 * Returns null when there's nothing to search for.
 */
export function searchFilter(q: string, tags: string[]): string | null {
  const term = q.replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  if (!term) return null;
  const lower = term.toLowerCase();
  const like = `*${term}*`;
  const parts = [
    `name.ilike.${like}`,
    `brand.ilike.${like}`,
    `notes.ilike.${like}`,
  ];
  const colors = COLOR_OPTIONS.filter(({ label }) =>
    label.toLowerCase().includes(lower),
  ).map(({ value }) => value);
  if (colors.length) parts.push(`colors.ov.{${colors.join(",")}}`);
  const matching = tags.filter(
    (tag) => tag.includes(lower) && !/["\\]/.test(tag),
  );
  if (matching.length)
    parts.push(`tags.ov.{${matching.map((tag) => `"${tag}"`).join(",")}}`);
  return parts.join(",");
}
