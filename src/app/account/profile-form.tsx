"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleState } from "@/lib/action-state";
import { DISPLAY_NAME_MAX } from "@/lib/validation/profile";
import { updateProfile } from "./actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, idleState);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          // Remount when the saved value changes so Base UI's uncontrolled
          // defaultValue isn't swapped after init.
          key={displayName}
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="nickname"
          aria-invalid={state.status === "error" || undefined}
        />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
