import { LayersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Outfits" };

/** Placeholder until FRD feature 6 (saved outfits). */
export default function OutfitsPage() {
  return (
    <>
      <PageHeader title="Outfits" />
      <EmptyState
        icon={LayersIcon}
        title="No outfits yet"
        description="Combine pieces from your closet on the canvas and save the look."
        action={
          <Link href="/outfits/new" className={buttonVariants({ size: "lg" })}>
            Create an outfit
          </Link>
        }
      />
    </>
  );
}
