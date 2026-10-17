import Link from "next/link";
import { CHIP } from "@/components/shared/chip";
import { OCCASION_OPTIONS, SEASON_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { outfitsHref, type OutfitFilters } from "./outfit-filters";

const ROW =
  "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0";

/**
 * OU-2: Favorites, Season and Occasion as links, so they work without
 * JavaScript and survive reloads. Tapping an active chip clears it.
 */
export function OutfitFilterChips({ filters }: { filters: OutfitFilters }) {
  const chip = (label: string, active: boolean, href: string) => (
    <Link
      key={label}
      href={href}
      scroll={false}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        CHIP,
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Filter outfits" className="mb-6 space-y-2">
      <div className={ROW}>
        {chip(
          "Favorites",
          filters.favorites,
          outfitsHref({ ...filters, favorites: !filters.favorites }),
        )}
        {SEASON_OPTIONS.map(({ value, label }) =>
          chip(
            label,
            filters.season === value,
            outfitsHref({
              ...filters,
              season: filters.season === value ? null : value,
            }),
          ),
        )}
      </div>
      <div className={ROW}>
        {OCCASION_OPTIONS.map(({ value, label }) =>
          chip(
            label,
            filters.occasion === value,
            outfitsHref({
              ...filters,
              occasion: filters.occasion === value ? null : value,
            }),
          ),
        )}
      </div>
    </nav>
  );
}
