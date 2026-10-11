import { ShirtIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Closet" };

export default async function ClosetPage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("clothing_items")
    .select("id, name")
    .order("created_at", { ascending: false });
  return (
    <>
      <PageHeader
        title="Closet"
        actions={
          <Link href="/closet/new" className={buttonVariants({ size: "lg" })}>
            Add clothing
          </Link>
        }
      />
      {error ? (
        <p role="alert">
          Could not load your closet. Please refresh and try again.
        </p>
      ) : items?.length ? (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              {/* Until the Item Detail page (FRD step 2), tap to edit. */}
              <Link
                href={`/closet/${item.id}/edit`}
                className="block min-h-11 rounded-lg border border-border p-3 break-words hover:bg-accent"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </>
  );
}
