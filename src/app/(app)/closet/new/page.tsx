import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ClothingForm } from "@/features/clothing/clothing-form";
import { closetSuggestions } from "@/features/clothing/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add clothing" };

export default async function AddClothingPage() {
  const { brands, tags, failed } = await closetSuggestions(
    await createClient(),
  );
  return (
    <>
      <PageHeader title="Add clothing" />
      {failed && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Suggestions are unavailable. You can still type a brand and tags.
        </p>
      )}
      <ClothingForm brands={brands} tags={tags} />
    </>
  );
}
