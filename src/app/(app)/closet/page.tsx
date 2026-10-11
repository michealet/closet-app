import { SearchXIcon, ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  filtersToQuery,
  isFiltered,
  parseFilters,
  searchFilter,
} from "@/features/clothing/closet-filters";
import { ClosetGrid } from "@/features/clothing/closet-grid";
import { ClosetToolbar } from "@/features/clothing/closet-toolbar";
import { closetSuggestions } from "@/features/clothing/queries";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Closet" };

/** Items per "Show more" step; keeps the grid quick with 300+ items (NF-2). */
const PAGE_SIZE = 60;

export default async function ClosetPage(props: PageProps<"/closet">) {
  const params = await props.searchParams;
  const filters = parseFilters(params);
  const { show } = params;
  const limit = Math.min(
    Math.max(Number(show) || PAGE_SIZE, PAGE_SIZE),
    PAGE_SIZE * 50,
  );

  const supabase = await createClient();
  const { brands, tags } = await closetSuggestions(supabase);
  let query = supabase
    .from("clothing_items")
    .select("id, name, image_path, thumbnail_path, is_favorite", {
      count: "exact",
    });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.color) query = query.contains("colors", [filters.color]);
  if (filters.season) query = query.contains("seasons", [filters.season]);
  if (filters.brand) query = query.eq("brand", filters.brand);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  if (filters.favorites) query = query.eq("is_favorite", true);
  const search = searchFilter(filters.q, tags);
  if (search) query = query.or(search);
  query =
    filters.sort === "name"
      ? query.order("name", { ascending: true })
      : query.order("created_at", { ascending: false });
  const { data, count, error } = await query.order("id").range(0, limit - 1);
  const filtered = isFiltered(filters);
  const current = filtersToQuery(filters);
  const moreQuery = `${current ? `${current}&` : "?"}show=${limit + PAGE_SIZE}`;
  const items = data ?? [];
  const urls = await signedImageUrls(
    supabase,
    items.map((item) => item.thumbnail_path ?? item.image_path),
  );

  return (
    <>
      <PageHeader
        title="Closet"
        actions={
          <Link href="/closet/new" className={buttonVariants({ size: "lg" })}>
            Add clothing
          </Link>
        }
      />
      {(items.length > 0 || filtered) && (
        <ClosetToolbar filters={filters} brands={brands} tags={tags} />
      )}
      {error ? (
        <p role="alert">
          Could not load your closet. Please refresh and try again.
        </p>
      ) : items.length ? (
        <>
          <ClosetGrid
            items={items.map((item) => ({
              id: item.id,
              name: item.name,
              isFavorite: item.is_favorite,
              photoUrl:
                urls.get(item.thumbnail_path ?? item.image_path) ?? null,
            }))}
          />
          {(count ?? 0) > items.length && (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/closet${moreQuery}`}
                scroll={false}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Show more
              </Link>
            </div>
          )}
        </>
      ) : filtered ? (
        <EmptyState
          icon={SearchXIcon}
          title="No matches"
          description="Nothing in your closet matches. Try fewer filters or another word."
          action={
            <Link
              href="/closet"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Clear filters
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={ShirtIcon}
          title="Your closet is empty"
          description="Add your first piece: snap a photo and give it a name."
          action={
            <Link href="/closet/new" className={buttonVariants({ size: "lg" })}>
              Add clothing
            </Link>
          }
        />
      )}
    </>
  );
}
