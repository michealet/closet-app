"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_OPTIONS,
  NAME_MAX,
  type ClothingCategory,
} from "@/lib/constants";
import { ImageError } from "@/lib/images/prepare";
import { removeClosetFiles } from "@/lib/images/storage";
import { uploadItemPhoto } from "@/lib/images/upload";
import { createClient } from "@/lib/supabase/client";
import { addClothing, updateClothing } from "./actions";
import { clothingDetailsSchema } from "./schema";
import {
  ClothingOptionalFields,
  type OptionalDefaults,
} from "./optional-fields";

/** An existing item to edit (AC-10). */
export type EditableItem = OptionalDefaults & {
  id: string;
  name: string;
  category: ClothingCategory;
  imagePath: string;
  thumbnailPath: string | null;
  photoUrl: string | null;
};

/** Add form, or with `item` the same form pre-filled for editing (AC-10). */
export function ClothingForm({
  brands = [],
  item,
}: {
  brands?: string[];
  item?: EditableItem;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [brandOptions, setBrandOptions] = useState(brands);
  const photoRef = useRef<HTMLInputElement>(null);
  const focusedReset = useRef(0);
  useEffect(() => {
    if (resetKey > focusedReset.current && !pending) {
      photoRef.current?.focus();
      focusedReset.current = resetKey;
    }
  }, [resetKey, pending]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const another =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "another";
    const details = clothingDetailsSchema.safeParse({
      name: form.get("name"),
      category: form.get("category"),
      brand: form.get("brand"),
      notes: form.get("notes"),
      colors: form.getAll("colors"),
      seasons: form.getAll("seasons"),
    });
    const entry = form.get("photo");
    const photo = entry instanceof File && entry.size ? entry : null;
    const fail = (message: string) => {
      setError(message);
      toast.error(message);
    };
    if (!details.success) return fail(details.error.issues[0].message);
    if (!photo && !item) return fail("Choose a photo of your clothing.");

    setError("");
    startTransition(async () => {
      try {
        const uploaded = photo ? await uploadItemPhoto(photo, item?.id) : null;
        const result = item
          ? await updateClothing({
              itemId: item.id,
              ...details.data,
              ...(uploaded && {
                imagePath: uploaded.imagePath,
                thumbnailPath: uploaded.thumbnailPath,
              }),
            })
          : await addClothing({ ...details.data, ...uploaded });
        // A replaced photo with the same paths overwrote the old files.
        const newFiles =
          uploaded && uploaded.imagePath !== item?.imagePath
            ? [uploaded.imagePath, uploaded.thumbnailPath]
            : [];
        if (result.status === "error") {
          const removed = await removeClosetFiles(createClient(), newFiles);
          fail(
            result.message +
              (removed ? "" : " The unused photo couldn't be removed."),
          );
          return;
        }
        if (result.status === "success") {
          if (item && newFiles.length) {
            // The photo's format changed (WebP ↔ JPEG): drop the old files.
            await removeClosetFiles(createClient(), [
              item.imagePath,
              item.thumbnailPath,
            ]);
          }
          toast.success(result.message);
          if (another) {
            if (details.data.brand)
              setBrandOptions((values) =>
                [...new Set([...values, details.data.brand!])].sort(),
              );
            setResetKey((key) => key + 1);
            router.refresh();
            return;
          }
          router.push(item ? `/closet/${item.id}` : "/closet");
          router.refresh();
        }
      } catch (cause) {
        // A lost response may follow a committed save; don't delete its photo.
        fail(
          cause instanceof ImageError
            ? cause.message
            : "Couldn't finish saving. Check your closet before trying again.",
        );
      }
    });
  }

  return (
    <form key={resetKey} onSubmit={submit} className="max-w-lg space-y-6">
      <fieldset disabled={pending} className="space-y-6">
        <div className="space-y-2">
          {item?.photoUrl && (
            <Image
              src={item.photoUrl}
              alt={item.name}
              width={160}
              height={160}
              unoptimized
              className="size-40 rounded-lg bg-tile object-contain"
            />
          )}
          <Label htmlFor="photo">
            {item ? "Replace photo (optional)" : "Photo"}
          </Label>
          <Input
            id="photo"
            ref={photoRef}
            name="photo"
            type="file"
            accept="image/*,.heic,.heif"
            required={!item}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={NAME_MAX}
            defaultValue={item?.name}
            placeholder="e.g. Blue linen shirt"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            required
            defaultValue={item?.category ?? ""}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-ring"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <ClothingOptionalFields brands={brandOptions} defaults={item} />
        <Button type="submit" size="lg" className="w-full">
          {pending ? "Saving…" : item ? "Save changes" : "Save clothing"}
        </Button>
        {!item && (
          <Button
            type="submit"
            value="another"
            size="lg"
            variant="secondary"
            className="w-full"
          >
            Save &amp; add another
          </Button>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
