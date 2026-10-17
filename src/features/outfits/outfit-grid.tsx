import Link from "next/link";
import { HeartButton } from "@/components/shared/heart-button";
import { ImageTile } from "@/components/shared/image-tile";
import { OCCASION_LABELS, type Occasion } from "@/lib/constants";
import { setOutfitFavorite } from "./actions";

export type OutfitCard = {
  id: string;
  name: string;
  occasion: Occasion | null;
  thumbnailUrl: string | null;
  isFavorite: boolean;
};

/** OU-1: outfit cards with thumbnail, name, occasion tag and heart. */
export function OutfitGrid({ outfits }: { outfits: OutfitCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {outfits.map((outfit) => (
        <li key={outfit.id} className="relative">
          <Link
            href={`/outfits/${outfit.id}`}
            className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ImageTile
              src={outfit.thumbnailUrl}
              alt={outfit.name}
              className="aspect-[3/4] transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]"
            />
            <p className="mt-2 truncate text-sm">{outfit.name}</p>
            {outfit.occasion && (
              <p className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                {OCCASION_LABELS[outfit.occasion]}
              </p>
            )}
          </Link>
          {/* Outside the link: a button can't sit inside an <a>. */}
          <HeartButton
            id={outfit.id}
            name={outfit.name}
            isFavorite={outfit.isFavorite}
            action={setOutfitFavorite}
            className="absolute top-1.5 right-1.5"
          />
        </li>
      ))}
    </ul>
  );
}
