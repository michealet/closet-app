import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { OutfitCreator } from "@/features/outfits/outfit-creator";
import { pickerCloset } from "@/features/outfits/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit outfit" };

/** Edit a saved outfit in the creator (FRD OC-11, OU-4). */
export default async function EditOutfitPage(
  props: PageProps<"/outfits/[id]/edit">,
) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "id, name, occasion, seasons, notes, is_favorite, thumbnail_path, outfit_items(clothing_item_id, x, y, width, z_index)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!outfit) notFound();
  const { closet, failed } = await pickerCloset(supabase);

  return (
    <>
      <PageHeader title="Edit outfit" />
      {failed ? (
        <p role="alert">
          Could not load your closet. Please refresh and try again.
        </p>
      ) : (
        <OutfitCreator
          closet={closet}
          outfit={{
            id: outfit.id,
            name: outfit.name,
            occasion: outfit.occasion,
            seasons: outfit.seasons,
            notes: outfit.notes,
            isFavorite: outfit.is_favorite,
            thumbnailPath: outfit.thumbnail_path,
            items: outfit.outfit_items.map((piece) => ({
              id: piece.clothing_item_id,
              x: piece.x,
              y: piece.y,
              width: piece.width,
              z: piece.z_index,
            })),
          }}
        />
      )}
    </>
  );
}
