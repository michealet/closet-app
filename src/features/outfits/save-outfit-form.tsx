"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SeasonFields } from "@/components/shared/season-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NAME_MAX,
  NOTES_MAX,
  OCCASION_OPTIONS,
  type Occasion,
  type Season,
} from "@/lib/constants";
import { removeClosetFiles } from "@/lib/images/storage";
import { uploadOutfitThumbnail } from "@/lib/images/upload";
import { createClient } from "@/lib/supabase/client";
import { saveOutfit, updateOutfit } from "./actions";
import type { CanvasItem } from "./layout";
import { outfitDetailsSchema } from "./schema";

const SELECT =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-ring";

/** A saved outfit opened for editing (OC-11). */
export type EditableOutfit = {
  id: string;
  name: string;
  occasion: Occasion | null;
  seasons: Season[];
  notes: string | null;
  isFavorite: boolean;
  thumbnailPath: string | null;
  items: CanvasItem[];
};

/**
 * Save form (OC-9): saves the details, the canvas and its thumbnail (OC-10).
 * With `outfit`, it's pre-filled and saves over that outfit (OC-11).
 */
export function SaveOutfitForm({
  items,
  snapshotRef,
  onCancel,
  outfit,
}: {
  items: CanvasItem[];
  snapshotRef: RefObject<(() => HTMLCanvasElement | null) | null>;
  onCancel: () => void;
  outfit?: EditableOutfit;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focusing also scrolls the form into view below the canvas on phones.
    nameRef.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const details = outfitDetailsSchema.safeParse({
      name: form.get("name"),
      occasion: form.get("occasion") || null,
      seasons: form.getAll("seasons"),
      notes: form.get("notes"),
      isFavorite: form.get("favorite") === "on",
    });
    const fail = (message: string) => {
      setError(message);
      toast.error(message);
    };
    if (!details.success) return fail(details.error.issues[0].message);
    if (!items.length) return fail("Add at least one piece to your outfit.");

    setError("");
    startTransition(async () => {
      const outfitId = outfit?.id ?? crypto.randomUUID();
      // An edit's picture overwrites the old one when the format matches.
      const oldPicture = outfit?.thumbnailPath ?? null;
      // The outfit still saves without its picture (ADR 0003).
      let thumbnailPath: string | null = null;
      try {
        const picture = snapshotRef.current?.();
        if (picture)
          thumbnailPath = await uploadOutfitThumbnail(picture, outfitId);
      } catch {
        thumbnailPath = null;
      }
      try {
        const result = await (outfit ? updateOutfit : saveOutfit)({
          outfitId,
          ...details.data,
          thumbnailPath,
          items,
        });
        if (result.status === "error") {
          if (thumbnailPath !== oldPicture)
            await removeClosetFiles(createClient(), [thumbnailPath]);
          fail(result.message);
          return;
        }
        if (result.status !== "success") return;
        if (oldPicture && oldPicture !== thumbnailPath)
          await removeClosetFiles(createClient(), [oldPicture]);
        if (thumbnailPath) toast.success(result.message);
        else
          toast.warning(
            `${result.message} Its picture couldn't be made, so its card shows no preview.`,
          );
        router.push(outfit ? `/outfits/${outfit.id}` : "/outfits");
        router.refresh();
      } catch {
        // A lost response may follow a committed save; keep its picture.
        fail("Couldn't finish saving. Check your outfits before trying again.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-label="Save outfit">
      <fieldset disabled={pending} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="outfit-name">Name</Label>
          <Input
            id="outfit-name"
            ref={nameRef}
            name="name"
            required
            maxLength={NAME_MAX}
            defaultValue={outfit?.name}
            placeholder="e.g. Friday dinner"
            enterKeyHint="done"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occasion">Occasion (optional)</Label>
          <select
            id="occasion"
            name="occasion"
            defaultValue={outfit?.occasion ?? ""}
            className={SELECT}
          >
            <option value="">No occasion</option>
            {OCCASION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <SeasonFields defaults={outfit?.seasons} />
        <div className="space-y-2">
          <Label htmlFor="outfit-notes">Notes (optional)</Label>
          <textarea
            id="outfit-notes"
            name="notes"
            maxLength={NOTES_MAX}
            rows={3}
            defaultValue={outfit?.notes ?? ""}
            className="w-full rounded-lg border border-input bg-background p-3 text-base focus-visible:outline-ring"
          />
        </div>
        <Label className="min-h-11 gap-2">
          <input
            type="checkbox"
            name="favorite"
            defaultChecked={outfit?.isFavorite}
            className="size-4"
          />
          Add to favorites
        </Label>
        <div className="grid gap-3">
          <Button type="submit" size="lg">
            {pending ? "Saving…" : outfit ? "Save changes" : "Save outfit"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={onCancel}
          >
            Back to closet
          </Button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
