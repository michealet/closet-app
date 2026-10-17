"use client";

import { useEffect, useState, type DragEvent, type Ref } from "react";
import { CircleCheck, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { looksLikeHeic } from "@/lib/images/prepare";
import { cn } from "@/lib/utils";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Picks the one supported photo from a drop, or says what's wrong (#30). */
export function pickDroppedPhoto(
  files: ArrayLike<File>,
): { file: File } | { error: string } {
  if (files.length !== 1) return { error: "Drop one photo at a time." };
  const file = files[0];
  if (PHOTO_TYPES.includes(file.type) || looksLikeHeic(file)) return { file };
  return { error: "That file isn't a photo. Try a JPEG, PNG, WebP or HEIC." };
}

function hasFiles(event: { dataTransfer: DataTransfer | null }) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

/**
 * The photo field as a drop area (#30). Clicking or the keyboard opens the
 * picker (camera and library on phones); a dropped photo is put into the same
 * file input, so Save processes and uploads it the same way.
 */
export function PhotoDropArea({
  label,
  required,
  inputRef,
}: {
  label: string;
  required: boolean;
  inputRef: Ref<HTMLInputElement>;
}) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  // A file dropped next to the area would make the browser open it and lose the form.
  useEffect(() => {
    const guard = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const input = event.currentTarget.querySelector("input");
    if (!input || input.disabled) return;
    const picked = pickDroppedPhoto(event.dataTransfer.files);
    if ("error" in picked) {
      // Keeps whatever photo was already selected.
      setError(picked.error);
      toast.error(picked.error);
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(picked.file);
    input.files = transfer.files;
    // Lets the form (and this area) react as if the picker chose it.
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="photo">{label}</Label>
      <div
        onClick={(event) => {
          const input = event.currentTarget.querySelector("input");
          if (event.target !== input) input?.click();
        }}
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false);
        }}
        onDrop={drop}
        data-dragging={dragging || undefined}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-4 text-center transition-colors",
          "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50",
          "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
          dragging && "border-brand bg-accent",
        )}
      >
        {fileName ? (
          <CircleCheck aria-hidden className="size-6 text-brand" />
        ) : (
          <ImagePlus aria-hidden className="size-6 text-muted-foreground" />
        )}
        <p id="photo-hint" className="text-sm text-muted-foreground">
          {fileName ? (
            <>
              Selected: <span className="text-foreground">{fileName}</span>
            </>
          ) : (
            "Drag a photo here, or tap to choose one"
          )}
        </p>
        <input
          id="photo"
          ref={inputRef}
          name="photo"
          type="file"
          accept="image/*,.heic,.heif"
          required={required}
          aria-describedby="photo-hint"
          onChange={(event) => {
            setError("");
            setFileName(event.currentTarget.files?.[0]?.name ?? "");
          }}
          className="sr-only"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
