import { ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { OutfitCreator } from "@/features/outfits/outfit-creator";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create an outfit" };

/** Picker size cap; the closet is expected to stay in the hundreds (NF-2). */
const PICKER_LIMIT = 1000;

/** Outfit creator (FRD §8); `?item=` starts with that piece (OC-13). */
export default async function CreateOutfitPage(
  props: PageProps<"/outfits/new">,
) {
  const { item } = await props.searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .select("id, name, category, image_path, thumbnail_path")
    .order("created_at", { ascending: false })
    .order("id")
    .limit(PICKER_LIMIT);
  const items = data ?? [];
  // Thumbnails while editing (ADR 0003); they're small and quick to draw.
  const urls = await signedImageUrls(
    supabase,
    items.map((item) => item.thumbnail_path ?? item.image_path),
  );

  return (
    <>
      <PageHeader title="Create an outfit" />
      {error ? (
        <p role="alert">
          Could not load your closet. Please refresh and try again.
        </p>
      ) : items.length ? (
        <OutfitCreator
          startWith={typeof item === "string" ? item : undefined}
          closet={items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            photoUrl: urls.get(item.thumbnail_path ?? item.image_path) ?? null,
          }))}
        />
      ) : (
        <EmptyState
          icon={ShirtIcon}
          title="Add some clothing first"
          description="Outfits are made from pieces in your closet."
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
