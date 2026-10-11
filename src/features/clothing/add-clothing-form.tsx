"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_OPTIONS, NAME_MAX } from "@/lib/constants";
import { ImageError } from "@/lib/images/prepare";
import { removeClosetFiles } from "@/lib/images/storage";
import { uploadItemPhoto } from "@/lib/images/upload";
import { createClient } from "@/lib/supabase/client";
import { addClothing } from "./actions";
import { clothingDetailsSchema } from "./schema";
import { ClothingOptionalFields } from "./optional-fields";

export function AddClothingForm({ brands = [] }: { brands?: string[] }) {
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
    const photo = form.get("photo");
    const fail = (message: string) => {
      setError(message);
      toast.error(message);
    };
    if (!details.success) return fail(details.error.issues[0].message);
    if (!(photo instanceof File) || !photo.size)
      return fail("Choose a photo of your clothing.");

    setError("");
    startTransition(async () => {
      try {
        const uploaded = await uploadItemPhoto(photo);
        const result = await addClothing({ ...details.data, ...uploaded });
        if (result.status === "error") {
          const removed = await removeClosetFiles(createClient(), [
            uploaded.imagePath,
            uploaded.thumbnailPath,
          ]);
          fail(
            result.message +
              (removed ? "" : " The unused photo couldn't be removed."),
          );
          return;
        }
        if (result.status === "success") {
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
          router.push("/closet");
          router.refresh();
        }
      } catch (cause) {
        // A lost response may follow a committed insert; don't delete its photo.
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
          <Label htmlFor="photo">Photo</Label>
          <Input
            id="photo"
            ref={photoRef}
            name="photo"
            type="file"
            accept="image/*,.heic,.heif"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={NAME_MAX}
            placeholder="e.g. Blue linen shirt"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
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
        <ClothingOptionalFields brands={brandOptions} />
        <Button type="submit" size="lg" className="w-full">
          {pending ? "Uploading and saving…" : "Save clothing"}
        </Button>
        <Button
          type="submit"
          value="another"
          size="lg"
          variant="secondary"
          className="w-full"
        >
          Save &amp; add another
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
