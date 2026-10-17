"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteOutfit } from "./actions";

/** OU-5: the warning says how many calendar plans go with the outfit. */
export function deleteWarning(planCount: number): string {
  if (planCount === 0) return "This can't be undone.";
  const plans = planCount === 1 ? "1 date" : `${planCount} dates`;
  return `This outfit is planned on ${plans}. Those plans will be removed too. This can't be undone.`;
}

export function DeleteOutfitButton({
  outfitId,
  name,
  planCount,
}: {
  outfitId: string;
  name: string;
  planCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      try {
        const result = await deleteOutfit(outfitId);
        if (result.status === "error") {
          toast.error(result.message);
          return;
        }
        if (result.status === "success") {
          toast.success(result.message);
          setOpen(false);
          router.push("/outfits");
          router.refresh();
        }
      } catch {
        toast.error("Couldn't finish deleting. Check your outfits.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="lg" className="w-full" />}
      >
        <Trash2Icon aria-hidden />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteWarning(planCount)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            onClick={remove}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
