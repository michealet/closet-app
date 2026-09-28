import { z } from "zod";

/** A same-origin path to return to after sign-in. Rejects absolute and protocol-relative URLs. */
export const redirectPathSchema = z
  .string()
  .regex(/^\/(?![/\\])/, "Must be a relative path")
  .catch("/account");

export const magicLinkSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  next: redirectPathSchema,
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
