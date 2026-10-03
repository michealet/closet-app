import { ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Closet" };

/** Placeholder until FRD feature 2 (closet grid). */
export default function ClosetPage() {
  return (
    <>
      <PageHeader title="Closet" />
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
    </>
  );
}
