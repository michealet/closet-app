"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CheckIcon, SearchIcon } from "lucide-react";
import { ImageTile } from "@/components/shared/image-tile";
import { Input } from "@/components/ui/input";
import { CHIP } from "@/features/clothing/closet-toolbar";
import { CATEGORY_OPTIONS, type ClothingCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { placeItem, type CanvasItem } from "./layout";

/** Konva only loads on this page, in the browser (ADR 0003). */
const OutfitCanvas = dynamic(() => import("./outfit-canvas"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-tile" />
  ),
});

export type PickerItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  photoUrl: string | null;
};

/** Canvas plus closet picker (OC-1–OC-3); positions stay 0–1 (OC-7). */
export function OutfitCreator({ closet }: { closet: PickerItem[] }) {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [q, setQ] = useState("");

  const byId = new Map(closet.map((item) => [item.id, item]));
  const photos = new Map(
    closet.map((item) => [item.id, { url: item.photoUrl, name: item.name }]),
  );
  const term = q.trim().toLowerCase();
  const shown = closet.filter(
    (item) =>
      (!category || item.category === category) &&
      (!term || item.name.toLowerCase().includes(term)),
  );
  const categories = CATEGORY_OPTIONS.filter(({ value }) =>
    closet.some((item) => item.category === value),
  );

  /** `photo` is the picker tile's image, already loaded, for the photo's shape. */
  function toggle(piece: PickerItem, photo: HTMLImageElement | null) {
    if (items.some((item) => item.id === piece.id)) {
      setItems(items.filter((item) => item.id !== piece.id));
      if (selectedId === piece.id) setSelectedId(null);
      return;
    }
    setItems([
      ...items,
      placeItem(
        piece.id,
        piece.category,
        photo?.naturalWidth ? photo.naturalHeight / photo.naturalWidth : 1,
        items,
        (id) => byId.get(id)?.category,
      ),
    ]);
    setSelectedId(piece.id);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start">
      <div className="mx-auto w-full max-w-[calc((100dvh-24rem)*0.75)] min-w-64 md:sticky md:top-6 md:max-w-[calc((100dvh-10rem)*0.75)]">
        <OutfitCanvas
          items={items}
          photos={photos}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={(changed) =>
            setItems((current) =>
              current.map((item) => (item.id === changed.id ? changed : item)),
            )
          }
        />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {items.length
            ? "Drag to move. Drag a corner to resize."
            : "Tap pieces below to add them."}
        </p>
      </div>

      <section aria-label="Your closet" className="space-y-3">
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search your closet"
            placeholder="Search by name…"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            enterKeyHint="search"
            className="pl-9"
          />
        </div>
        <div
          role="group"
          aria-label="Category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {[{ value: null, label: "All" }, ...categories].map(
            ({ value, label }) => (
              <button
                key={label}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={cn(
                  CHIP,
                  category === value
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                {label}
              </button>
            ),
          )}
        </div>
        {shown.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
            {shown.map((piece) => {
              const added = items.some((item) => item.id === piece.id);
              return (
                <li key={piece.id}>
                  <button
                    type="button"
                    aria-pressed={added}
                    aria-label={piece.name}
                    onClick={(event) =>
                      toggle(piece, event.currentTarget.querySelector("img"))
                    }
                    className={cn(
                      "relative block w-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      added && "ring-2 ring-brand",
                    )}
                  >
                    <ImageTile
                      src={piece.photoUrl}
                      alt={piece.name}
                      sizes="(min-width: 768px) 7rem, 33vw"
                    />
                    {added && (
                      <CheckIcon
                        aria-hidden
                        className="absolute top-1.5 right-1.5 size-5 rounded-full bg-brand p-0.5 text-brand-foreground"
                      />
                    )}
                    <span className="mt-1 block truncate text-xs">
                      {piece.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {closet.length
              ? "Nothing matches. Try another word or category."
              : "Your closet is empty. Add clothing first."}
          </p>
        )}
      </section>
    </div>
  );
}
