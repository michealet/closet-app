import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { ClothingForm } from "@/features/clothing/clothing-form";
import { brandSuggestions } from "@/features/clothing/queries";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit clothing" };

/** Edit an item with the Add form, pre-filled (AC-10). */
export default async function EditClothingPage(
  props: PageProps<"/closet/[id]/edit">,
) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: item }, { brands }] = await Promise.all([
    supabase
      .from("clothing_items")
      .select(
        "id, name, category, brand, colors, seasons, notes, image_path, thumbnail_path",
      )
      .eq("id", id)
      .maybeSingle(),
    brandSuggestions(supabase),
  ]);
  if (!item) notFound();

  const preview = item.thumbnail_path ?? item.image_path;
  const urls = await signedImageUrls(supabase, [preview]);
  return (
    <>
      <PageHeader title="Edit clothing" />
      <ClothingForm
        brands={brands}
        item={{
          id: item.id,
          name: item.name,
          category: item.category,
          brand: item.brand,
          notes: item.notes,
          colors: item.colors,
          seasons: item.seasons,
          imagePath: item.image_path,
          thumbnailPath: item.thumbnail_path,
          photoUrl: urls.get(preview) ?? null,
        }}
      />
    </>
  );
}
