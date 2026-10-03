"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleState } from "@/lib/action-state";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth";
import { authenticate } from "./actions";

type Mode = "signin" | "signup";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, pending] = useActionState(authenticate, idleState);
  const signUp = mode === "signup";

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  if (state.status === "success") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value={mode} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          // Not type="email": iOS Safari turns autocorrect off for email
          // inputs, which also disables Text Replacement shortcuts (#14).
          // inputMode keeps the email keyboard; the server validates it.
          type="text"
          inputMode="email"
          autoCorrect="on"
          autoCapitalize="none"
          spellCheck={false}
          // "username" lets iOS Passwords / password managers pair this
          // field with the password and offer saved logins.
          autoComplete="username"
          required
          aria-invalid={state.status === "error" || undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={signUp ? "new-password" : "current-password"}
          minLength={signUp ? PASSWORD_MIN : undefined}
          maxLength={PASSWORD_MAX}
          required
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={signUp ? "password-hint" : undefined}
        />
        {signUp && (
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least {PASSWORD_MIN} characters.
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending
          ? signUp
            ? "Creating account…"
            : "Signing in…"
          : signUp
            ? "Create account"
            : "Sign in"}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={() => setMode(signUp ? "signin" : "signup")}
      >
        {signUp
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </Button>
    </form>
  );
}
