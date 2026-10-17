import { LayersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Outfits" };

/** Placeholder until FRD feature 6 (saved outfits); counts what's saved. */
export default async function OutfitsPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("outfits")
    .select("id", { count: "exact", head: true });
  const saved = count ?? 0;

  return (
    <>
      <PageHeader title="Outfits" />
      <EmptyState
        icon={LayersIcon}
        title={
          saved
            ? `${saved} saved ${saved === 1 ? "outfit" : "outfits"}`
            : "No outfits yet"
        }
        description={
          saved
            ? "Browsing your saved outfits is coming next."
            : "Combine pieces from your closet on the canvas and save the look."
        }
        action={
          <Link href="/outfits/new" className={buttonVariants({ size: "lg" })}>
            Create an outfit
          </Link>
        }
      />
    </>
  );
}
