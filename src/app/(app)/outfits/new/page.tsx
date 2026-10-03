import { SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Create an outfit" };

/** Placeholder until FRD feature 4 (outfit creator). */
export default function CreateOutfitPage() {
  return (
    <>
      <PageHeader title="Create an outfit" />
      <EmptyState
        icon={SparklesIcon}
        title="Coming soon"
        description="This is where you'll arrange pieces on a canvas to build a look."
      />
    </>
  );
}
