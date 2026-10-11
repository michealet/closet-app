import { ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ClosetGrid } from "@/features/clothing/closet-grid";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Closet" };

/** Items per "Show more" step; keeps the grid quick with 300+ items (NF-2). */
const PAGE_SIZE = 60;

export default async function ClosetPage(props: PageProps<"/closet">) {
  const { show } = await props.searchParams;
  const limit = Math.min(
    Math.max(Number(show) || PAGE_SIZE, PAGE_SIZE),
    PAGE_SIZE * 50,
  );

  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("clothing_items")
    .select("id, name, image_path, thumbnail_path", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
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
              photoUrl:
                urls.get(item.thumbnail_path ?? item.image_path) ?? null,
            }))}
          />
          {(count ?? 0) > items.length && (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/closet?show=${limit + PAGE_SIZE}`}
                scroll={false}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Show more
              </Link>
            </div>
          )}
        </>
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
