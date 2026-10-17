"use client";

import { CopyIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { duplicateOutfit } from "./actions";

/** Duplicate (OU-4): makes "Copy of …" and opens it in the creator. */
export function DuplicateOutfitButton({ outfitId }: { outfitId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      try {
        const result = await duplicateOutfit(outfitId);
        if (result.status === "error") {
          toast.error(result.message);
          return;
        }
        if (result.status === "success" && result.outfitId) {
          toast.success(result.message);
          router.push(`/outfits/${result.outfitId}/edit`);
        }
      } catch {
        toast.error("Couldn't finish duplicating. Check your outfits.");
      }
    });
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={duplicate}
    >
      <CopyIcon aria-hidden />
      {pending ? "Duplicating…" : "Duplicate"}
    </Button>
  );
}
