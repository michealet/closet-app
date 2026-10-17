import { LayersIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { OutfitFilterChips } from "@/features/outfits/outfit-filter-chips";
import {
  isOutfitFiltered,
  parseOutfitFilters,
} from "@/features/outfits/outfit-filters";
import { OutfitGrid } from "@/features/outfits/outfit-grid";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Outfits" };

/** Outfits shown at once; plenty for a personal closet (NF-2). */
const OUTFITS_LIMIT = 500;

/** Saved outfits (FRD §9: OU-1, OU-2). */
export default async function OutfitsPage(props: PageProps<"/outfits">) {
  const filters = parseOutfitFilters(await props.searchParams);
  const filtered = isOutfitFiltered(filters);

  const supabase = await createClient();
  let query = supabase
    .from("outfits")
    .select("id, name, occasion, thumbnail_path, is_favorite");
  if (filters.favorites) query = query.eq("is_favorite", true);
  if (filters.occasion) query = query.eq("occasion", filters.occasion);
  if (filters.season) query = query.contains("seasons", [filters.season]);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .limit(OUTFITS_LIMIT);
  const outfits = data ?? [];
  const urls = await signedImageUrls(
    supabase,
    outfits.flatMap(({ thumbnail_path }) =>
      thumbnail_path ? [thumbnail_path] : [],
    ),
  );
  const create = (
    <Link href="/outfits/new" className={buttonVariants({ size: "lg" })}>
      Create an outfit
    </Link>
  );

  return (
    <>
      <PageHeader title="Outfits" actions={outfits.length ? create : null} />
      {(outfits.length > 0 || filtered) && (
        <OutfitFilterChips filters={filters} />
      )}
      {error ? (
        <p role="alert">
          Could not load your outfits. Please refresh and try again.
        </p>
      ) : outfits.length ? (
        <OutfitGrid
          outfits={outfits.map((outfit) => ({
            id: outfit.id,
            name: outfit.name,
            occasion: outfit.occasion,
            isFavorite: outfit.is_favorite,
            thumbnailUrl: outfit.thumbnail_path
              ? (urls.get(outfit.thumbnail_path) ?? null)
              : null,
          }))}
        />
      ) : filtered ? (
        <EmptyState
          icon={SearchXIcon}
          title="No matches"
          description="No outfits match these filters. Try fewer."
          action={
            <Link
              href="/outfits"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Clear filters
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={LayersIcon}
          title="No outfits yet"
          description="Combine pieces from your closet on the canvas and save the look."
          action={create}
        />
      )}
    </>
  );
}
