"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_NAME_MAX } from "@/lib/constants";
import { planOutfit } from "./actions";

/** Today in the viewer's own time zone, as YYYY-MM-DD for the date input. */
export function localToday(now = new Date()): string {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Assign to date (OU-4, CA-3, CA-4): a date and an optional event name. */
export function PlanOutfitForm({ outfitId }: { outfitId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await planOutfit({
          outfitId,
          date: form.get("date"),
          eventName: form.get("eventName"),
        });
        if (result.status === "error") {
          setError(result.message);
          toast.error(result.message);
          return;
        }
        if (result.status === "success") {
          toast.success(result.message);
          setError("");
          setOpen(false);
          router.refresh();
        }
      } catch {
        toast.error("Couldn't finish planning. Check your calendar.");
      }
    });
  }

  if (!open)
    return (
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <CalendarPlusIcon aria-hidden />
        Assign to date
      </Button>
    );

  return (
    <form
      onSubmit={submit}
      aria-label="Assign to date"
      className="space-y-4 rounded-xl border border-border p-4"
    >
      <fieldset disabled={pending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan-date">Date</Label>
          <Input
            id="plan-date"
            name="date"
            type="date"
            required
            defaultValue={localToday()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-event">Event (optional)</Label>
          <Input
            id="plan-event"
            name="eventName"
            maxLength={EVENT_NAME_MAX}
            placeholder="e.g. Dinner with friends"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg">
            {pending ? "Planning…" : "Plan outfit"}
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
