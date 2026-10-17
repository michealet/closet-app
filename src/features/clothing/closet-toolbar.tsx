"use client";

import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  COLORS,
  SEASON_LABELS,
  SEASON_OPTIONS,
} from "@/lib/constants";
import { CHIP } from "@/components/shared/chip";
import { cn } from "@/lib/utils";
import {
  NO_FILTERS,
  filtersToQuery,
  isFiltered,
  type ClosetFilters,
} from "./closet-filters";

const SELECT =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-ring";

/** Search (CL-2), filters (CL-3), category chips (CL-4) and sort (CL-6). */
export function ClosetToolbar({
  filters,
  brands,
  tags,
}: {
  filters: ClosetFilters;
  brands: string[];
  tags: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // What the controls show: updated at once, then replaced by the server's
  // filters when the new page arrives (so slow networks don't feel stuck).
  const [shown, setShown] = useState(filters);
  const [received, setReceived] = useState(filters);
  if (filters !== received) {
    setReceived(filters);
    setShown(filters);
  }
  const [q, setQ] = useState(filters.q);
  const narrowing = [
    shown.color,
    shown.season,
    shown.brand,
    shown.tag,
    shown.favorites || null,
  ].filter(Boolean).length;
  const [open, setOpen] = useState(narrowing > 0);

  function apply(change: Partial<ClosetFilters>) {
    const next = { ...shown, ...change };
    setShown(next);
    startTransition(() =>
      router.replace(`/closet${filtersToQuery(next)}`, { scroll: false }),
    );
  }

  // Search as you type, after a short pause.
  useEffect(() => {
    const term = q.trim();
    if (term === shown.q) return;
    const timer = setTimeout(() => apply({ q: term }), 300);
    return () => clearTimeout(timer);
  });

  const active: { label: string; clear: Partial<ClosetFilters> }[] = [
    shown.color && {
      label: COLORS[shown.color].label,
      clear: { color: null },
    },
    shown.season && {
      label: SEASON_LABELS[shown.season],
      clear: { season: null },
    },
    shown.brand && { label: shown.brand, clear: { brand: null } },
    shown.tag && { label: `#${shown.tag}`, clear: { tag: null } },
    shown.favorites && { label: "Favorites", clear: { favorites: false } },
  ].filter((chip) => !!chip);

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search your closet"
          placeholder="Search name, brand, color, tag…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply({ q: q.trim() });
          }}
          enterKeyHint="search"
          className="pl-9"
        />
      </div>

      <div
        role="group"
        aria-label="Category"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {[{ value: null, label: "All" }, ...CATEGORY_OPTIONS].map(
          ({ value, label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={shown.category === value}
              onClick={() => apply({ category: value })}
              className={cn(
                CHIP,
                shown.category === value
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card",
              )}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          aria-expanded={open}
          aria-controls="closet-filters"
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontalIcon aria-hidden />
          Filters{narrowing ? ` (${narrowing})` : ""}
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort</span>
          <select
            value={shown.sort}
            onChange={(event) =>
              apply({ sort: event.target.value as ClosetFilters["sort"] })
            }
            className={cn(SELECT, "w-auto")}
          >
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {open && (
        <div
          id="closet-filters"
          className="grid gap-3 rounded-xl bg-tile p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="filter-color">Color</Label>
            <select
              id="filter-color"
              value={shown.color ?? ""}
              onChange={(event) =>
                apply({
                  color: (event.target.value || null) as ClosetFilters["color"],
                })
              }
              className={SELECT}
            >
              <option value="">Any color</option>
              {COLOR_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-season">Season</Label>
            <select
              id="filter-season"
              value={shown.season ?? ""}
              onChange={(event) =>
                apply({
                  season: (event.target.value ||
                    null) as ClosetFilters["season"],
                })
              }
              className={SELECT}
            >
              <option value="">Any season</option>
              {SEASON_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-brand">Brand</Label>
            <select
              id="filter-brand"
              value={shown.brand ?? ""}
              onChange={(event) => apply({ brand: event.target.value || null })}
              className={SELECT}
            >
              <option value="">Any brand</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-tag">Tag</Label>
            <select
              id="filter-tag"
              value={shown.tag ?? ""}
              onChange={(event) => apply({ tag: event.target.value || null })}
              className={SELECT}
            >
              <option value="">Any tag</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={shown.favorites}
              onChange={(event) => apply({ favorites: event.target.checked })}
              className="size-4"
            />
            Favorites only
          </label>
        </div>
      )}

      {(active.length > 0 || isFiltered(shown)) && (
        <ul
          className="flex flex-wrap items-center gap-2"
          aria-label="Active filters"
        >
          {shown.category && (
            <li>
              <button
                type="button"
                onClick={() => apply({ category: null })}
                aria-label={`Remove filter ${CATEGORY_LABELS[shown.category]}`}
                className={cn(
                  CHIP,
                  "border-transparent bg-accent text-accent-foreground",
                )}
              >
                {CATEGORY_LABELS[shown.category]}
                <XIcon aria-hidden className="size-3.5" />
              </button>
            </li>
          )}
          {active.map(({ label, clear }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => apply(clear)}
                aria-label={`Remove filter ${label}`}
                className={cn(
                  CHIP,
                  "border-transparent bg-accent text-accent-foreground",
                )}
              >
                {label}
                <XIcon aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
          <li>
            <Button
              type="button"
              variant="link"
              size="lg"
              onClick={() => {
                setQ("");
                apply({ ...NO_FILTERS, sort: shown.sort });
              }}
            >
              Clear all
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
