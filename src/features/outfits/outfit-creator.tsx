"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CheckIcon, SearchIcon } from "lucide-react";
import { ImageTile } from "@/components/shared/image-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHIP } from "@/features/clothing/closet-toolbar";
import { CATEGORY_OPTIONS, type ClothingCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LeaveGuard } from "./leave-guard";
import { moveLayer, placeItem, scaleItem, type CanvasItem } from "./layout";
import { PieceTools } from "./piece-tools";
import { SaveOutfitForm } from "./save-outfit-form";

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

/** The photo's height ÷ width, or 1 if it isn't known. */
function aspectOf(photo: HTMLImageElement | null) {
  return photo?.naturalWidth ? photo.naturalHeight / photo.naturalWidth : 1;
}

/**
 * Canvas plus closet picker (OC-1–OC-3), arranging (OC-6), then Save (OC-9);
 * positions stay 0–1 (OC-7). `startWith` is a piece to begin with (OC-13).
 */
export function OutfitCreator({
  closet,
  startWith,
}: {
  closet: PickerItem[];
  startWith?: string;
}) {
  const start = closet.find((item) => item.id === startWith);
  // Without a photo there's no shape to wait for: place it straight away.
  const [items, setItems] = useState<CanvasItem[]>(() =>
    start && !start.photoUrl
      ? [placeItem(start.id, start.category, 1, [], () => undefined)]
      : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    start && !start.photoUrl ? start.id : null,
  );
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const snapshotRef = useRef<(() => HTMLCanvasElement | null) | null>(null);

  const byId = new Map(closet.map((item) => [item.id, item]));
  const photos = new Map(
    closet.map((item) => [item.id, { url: item.photoUrl, name: item.name }]),
  );
  const selected = items.find((item) => item.id === selectedId);
  const term = q.trim().toLowerCase();
  const shown = closet.filter(
    (item) =>
      (!category || item.category === category) &&
      (!term || item.name.toLowerCase().includes(term)),
  );
  const categories = CATEGORY_OPTIONS.filter(({ value }) =>
    closet.some((item) => item.category === value),
  );

  function add(piece: PickerItem, aspect: number) {
    setItems((current) =>
      current.some((item) => item.id === piece.id)
        ? current
        : [
            ...current,
            placeItem(
              piece.id,
              piece.category,
              aspect,
              current,
              (id) => byId.get(id)?.category,
            ),
          ],
    );
    setSelectedId(piece.id);
  }

  // Started from an item's page (OC-13): place it once its photo's shape is known.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !start?.photoUrl) return;
    started.current = true;
    const photo = new window.Image();
    photo.onload = photo.onerror = () => add(start, aspectOf(photo));
    photo.src = start.photoUrl;
  });

  /** `photo` is the picker tile's image, already loaded, for the photo's shape. */
  function toggle(piece: PickerItem, photo: HTMLImageElement | null) {
    if (items.some((item) => item.id === piece.id)) {
      setItems(items.filter((item) => item.id !== piece.id));
      if (selectedId === piece.id) setSelectedId(null);
      return;
    }
    add(piece, aspectOf(photo));
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start">
      {/* Leaving after a successful save uses router.push, which isn't guarded. */}
      <LeaveGuard active={items.length > 0} />
      <div className="mx-auto w-full max-w-[calc((100dvh-24rem)*0.75)] min-w-64 md:sticky md:top-6 md:max-w-[calc((100dvh-10rem)*0.75)]">
        <OutfitCanvas
          items={items}
          photos={photos}
          selectedId={selectedId}
          onSelect={setSelectedId}
          snapshotRef={snapshotRef}
          onChange={(changed) =>
            setItems((current) =>
              current.map((item) => (item.id === changed.id ? changed : item)),
            )
          }
        />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {items.length
            ? "Drag to move. Pinch or drag a corner to resize."
            : "Tap pieces below to add them."}
        </p>
        {!saving && (
          <PieceTools
            items={items}
            names={new Map(closet.map((item) => [item.id, item.name]))}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onLayer={(step) =>
              selected && setItems(moveLayer(items, selected.id, step))
            }
            onScale={(factor) =>
              selected &&
              setItems(
                items.map((item) =>
                  item.id === selected.id ? scaleItem(item, factor) : item,
                ),
              )
            }
            onRemove={() => {
              setItems(items.filter((item) => item.id !== selectedId));
              setSelectedId(null);
            }}
          />
        )}
        {!saving && (
          <Button
            type="button"
            size="lg"
            className="mt-3 w-full"
            disabled={!items.length}
            onClick={() => {
              setSelectedId(null);
              setSaving(true);
            }}
          >
            Save outfit
          </Button>
        )}
      </div>

      {saving ? (
        <SaveOutfitForm
          items={items}
          snapshotRef={snapshotRef}
          onCancel={() => setSaving(false)}
        />
      ) : (
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
      )}
    </div>
  );
}
