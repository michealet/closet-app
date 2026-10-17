import { ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { OutfitCreator } from "@/features/outfits/outfit-creator";
import { pickerCloset } from "@/features/outfits/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create an outfit" };

/** Outfit creator (FRD §8); `?item=` starts with that piece (OC-13). */
export default async function CreateOutfitPage(
  props: PageProps<"/outfits/new">,
) {
  const { item } = await props.searchParams;
  const { closet, failed } = await pickerCloset(await createClient());

  return (
    <>
      <PageHeader title="Create an outfit" />
      {failed ? (
        <p role="alert">
          Could not load your closet. Please refresh and try again.
        </p>
      ) : closet.length ? (
        <OutfitCreator
          startWith={typeof item === "string" ? item : undefined}
          closet={closet}
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
