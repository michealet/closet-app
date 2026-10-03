import { CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Add clothing" };

/** Placeholder until FRD feature 1 (add clothing). */
export default function AddClothingPage() {
  return (
    <>
      <PageHeader title="Add clothing" />
      <EmptyState
        icon={CameraIcon}
        title="Coming soon"
        description="This is where you'll photograph a piece and add its details."
      />
    </>
  );
}
