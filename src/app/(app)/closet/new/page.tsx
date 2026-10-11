import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ClothingForm } from "@/features/clothing/clothing-form";
import { brandSuggestions } from "@/features/clothing/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add clothing" };

export default async function AddClothingPage() {
  const { brands, failed } = await brandSuggestions(await createClient());
  return (
    <>
      <PageHeader title="Add clothing" />
      {failed && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Brand suggestions are unavailable. You can still type a brand.
        </p>
      )}
      <ClothingForm brands={brands} />
    </>
  );
}
