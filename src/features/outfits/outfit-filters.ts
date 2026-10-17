/**
 * Outfits page filters (FRD OU-2): Favorites, Occasion and Season. They live
 * in the URL (`/outfits?occasion=dinner&favorites=1`), like the closet's.
 * Pure functions, safe in server and browser code.
 */

import type { Occasion, Season } from "@/lib/constants";
import { Constants } from "@/types/database";

export type OutfitFilters = {
  favorites: boolean;
  occasion: Occasion | null;
  season: Season | null;
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(values: readonly T[], value: string) {
  return (values as readonly string[]).includes(value) ? (value as T) : null;
}

/** Reads filters from search params, ignoring anything unknown. */
export function parseOutfitFilters(params: Params): OutfitFilters {
  const enums = Constants.public.Enums;
  return {
    favorites: first(params.favorites) === "1",
    occasion: oneOf(enums.occasion, first(params.occasion)),
    season: oneOf(enums.season, first(params.season)),
  };
}

/** The `/outfits` link for `filters` ("" query when nothing is set). */
export function outfitsHref(filters: OutfitFilters): string {
  const params = new URLSearchParams();
  if (filters.favorites) params.set("favorites", "1");
  if (filters.occasion) params.set("occasion", filters.occasion);
  if (filters.season) params.set("season", filters.season);
  const query = params.toString();
  return query ? `/outfits?${query}` : "/outfits";
}

export function isOutfitFiltered(filters: OutfitFilters): boolean {
  return filters.favorites || !!filters.occasion || !!filters.season;
}
