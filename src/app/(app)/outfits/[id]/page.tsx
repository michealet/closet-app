import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { HeartButton } from "@/components/shared/heart-button";
import { ImageTile } from "@/components/shared/image-tile";
import { PageHeader } from "@/components/shared/page-header";
import { seasonsLabel } from "@/features/clothing/labels";
import { setOutfitFavorite } from "@/features/outfits/actions";
import { DeleteOutfitButton } from "@/features/outfits/delete-outfit-button";
import { PlanOutfitForm } from "@/features/outfits/plan-outfit-form";
import { OutfitView } from "@/features/outfits/outfit-view";
import { OCCASION_LABELS } from "@/lib/constants";
import { signedImageUrls } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Outfit" };

/** A plan's date (YYYY-MM-DD, no time zone) as "Sat, Oct 24, 2026". */
const planDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

/** Outfit Detail (FRD OU-3, OU-4): large view, details, pieces and actions. */
export default async function OutfitDetailPage(
  props: PageProps<"/outfits/[id]">,
) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "id, name, occasion, seasons, notes, is_favorite, outfit_items(x, y, width, z_index, item:clothing_items(id, name, image_path, thumbnail_path)), planned_outfits(id, date, event_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!outfit) notFound();

  const pieces = outfit.outfit_items.flatMap(({ item, ...place }) =>
    item ? [{ ...item, ...place }] : [],
  );
  const urls = await signedImageUrls(
    supabase,
    pieces.flatMap((piece) => [
      piece.image_path,
      piece.thumbnail_path ?? piece.image_path,
    ]),
  );
  const plans = [...outfit.planned_outfits].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const seasons = seasonsLabel(outfit.seasons);
  const details: [string, string | null][] = [
    ["Occasion", outfit.occasion ? OCCASION_LABELS[outfit.occasion] : null],
    ["Seasons", seasons || null],
    ["Notes", outfit.notes],
  ];

  return (
    <div className="md:grid md:grid-cols-2 md:gap-10">
      <div className="relative mx-auto mb-6 w-full max-w-md md:mb-0">
        <OutfitView
          name={outfit.name}
          pieces={pieces.map((piece) => ({
            id: piece.id,
            name: piece.name,
            photoUrl: urls.get(piece.image_path) ?? null,
            x: piece.x,
            y: piece.y,
            width: piece.width,
            z: piece.z_index,
          }))}
        />
        <HeartButton
          id={outfit.id}
          name={outfit.name}
          isFavorite={outfit.is_favorite}
          action={setOutfitFavorite}
          className="absolute top-3 right-3"
        />
      </div>
      <div>
        <PageHeader title={outfit.name} />
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
          <h2 className="mb-3 text-xl">In this outfit</h2>
          {pieces.length ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {pieces.map((piece) => (
                <li key={piece.id}>
                  <Link href={`/closet/${piece.id}`} className="block">
                    <ImageTile
                      src={urls.get(piece.thumbnail_path ?? piece.image_path)}
                      alt={piece.name}
                      sizes="(min-width: 768px) 12vw, 33vw"
                    />
                    <p className="mt-2 truncate text-sm">{piece.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Its pieces were removed from your closet.
            </p>
          )}
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl">Planned for</h2>
          {plans.length ? (
            <ul className="space-y-1">
              {plans.map((plan) => (
                <li key={plan.id}>
                  {planDate(plan.date)}
                  {plan.event_name && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {plan.event_name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not planned for any date yet.
            </p>
          )}
          <PlanOutfitForm outfitId={outfit.id} />
        </section>

        <div className="mt-10">
          <DeleteOutfitButton
            outfitId={outfit.id}
            name={outfit.name}
            planCount={plans.length}
          />
        </div>
      </div>
    </div>
  );
}
