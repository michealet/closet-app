import { PencilIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageTile } from "@/components/shared/image-tile";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { colorDetails, seasonsLabel } from "@/features/clothing/labels";
import { CATEGORY_LABELS } from "@/lib/constants";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Item" };

/** Item Detail (FRD §7): ID-1, ID-3 and Edit (ID-4). */
export default async function ItemDetailPage(props: PageProps<"/closet/[id]">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("clothing_items")
    .select(
      "id, name, category, brand, colors, seasons, notes, image_path, outfit_items(outfit:outfits(id, name, thumbnail_path))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const outfits = item.outfit_items.flatMap(({ outfit }) =>
    outfit ? [outfit] : [],
  );
  const urls = await signedImageUrls(supabase, [
    item.image_path,
    ...outfits.flatMap(({ thumbnail_path }) =>
      thumbnail_path ? [thumbnail_path] : [],
    ),
  ]);
  const seasons = seasonsLabel(item.seasons);
  const details: [string, ReactNode][] = [
    ["Category", CATEGORY_LABELS[item.category]],
    ["Brand", item.brand],
    [
      "Colors",
      item.colors.length ? (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {colorDetails(item.colors).map(({ value, label, swatch }) => (
            <span key={value} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-3.5 rounded-full border border-border bg-muted"
                style={{ backgroundColor: swatch ?? undefined }}
              />
              {label}
            </span>
          ))}
        </span>
      ) : null,
    ],
    ["Seasons", seasons || null],
    ["Notes", item.notes],
  ];

  return (
    <div className="md:grid md:grid-cols-2 md:gap-10">
      <ImageTile
        src={urls.get(item.image_path)}
        alt={item.name}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
        className="mb-6 md:mb-0"
      />
      <div>
        <PageHeader
          title={item.name}
          actions={
            <Link
              href={`/closet/${item.id}/edit`}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <PencilIcon aria-hidden />
              Edit
            </Link>
          }
        />
        <dl className="space-y-4">
          {details.map(([term, value]) =>
            value ? (
              <div key={term}>
                <dt className="text-sm text-muted-foreground">{term}</dt>
                <dd className="mt-0.5 break-words whitespace-pre-line">
                  {value}
                </dd>
              </div>
            ) : null,
          )}
        </dl>

        <section className="mt-10">
          <h2 className="mb-3 text-xl">Outfits using this item</h2>
          {outfits.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {outfits.map((outfit) => (
                <li key={outfit.id}>
                  <Link href={`/outfits/${outfit.id}`} className="block">
                    <ImageTile
                      src={
                        outfit.thumbnail_path
                          ? urls.get(outfit.thumbnail_path)
                          : null
                      }
                      alt={outfit.name}
                    />
                    <p className="mt-2 truncate text-sm">{outfit.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={SparklesIcon}
              title="Not in any outfits yet"
              description="Outfits you create with this piece will show up here."
            />
          )}
        </section>
      </div>
    </div>
  );
}
