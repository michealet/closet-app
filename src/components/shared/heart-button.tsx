"use client";

import { HeartIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle for items and outfits (FV-1, FV-2): fills in at once,
 * saves in the background and goes back if the save fails.
 */
export function HeartButton({
  id,
  name,
  isFavorite,
  action,
  className,
}: {
  id: string;
  name: string;
  isFavorite: boolean;
  action: (input: { id: string; isFavorite: boolean }) => Promise<ActionState>;
  className?: string;
}) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      let result: ActionState;
      try {
        result = await action({ id, isFavorite: next });
      } catch {
        result = { status: "error", message: "Couldn't update your favorite." };
      }
      if (result.status === "error") {
        setFavorite(!next);
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorite}
      aria-label={`Favorite ${name}`}
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90",
        className,
      )}
    >
      <HeartIcon
        aria-hidden
        className={cn("size-5", favorite && "fill-brand text-brand")}
      />
    </button>
  );
}
