import { CalendarDaysIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Calendar" };

/** Placeholder until FRD feature 8 (outfit calendar). */
export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" />
      <EmptyState
        icon={CalendarDaysIcon}
        title="Nothing planned yet"
        description="Soon you'll be able to plan outfits for days and events here."
      />
    </>
  );
}
