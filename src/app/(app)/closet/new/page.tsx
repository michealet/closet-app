import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AddClothingForm } from "@/features/clothing/add-clothing-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add clothing" };

export default async function AddClothingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .select("brand")
    .not("brand", "is", null);
  const brands = [
    ...new Set(
      (data ?? []).flatMap(({ brand }) =>
        brand?.trim() ? [brand.trim()] : [],
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <>
      <PageHeader title="Add clothing" />
      {error && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Brand suggestions are unavailable. You can still type a brand.
        </p>
      )}
      <AddClothingForm brands={brands} />
    </>
  );
}
