import { z } from "zod";

export const DISPLAY_NAME_MAX = 80;

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX, `Keep it under ${DISPLAY_NAME_MAX} characters`)
    .transform((v) => (v === "" ? null : v)),
});

export type ProfileInput = z.infer<typeof profileSchema>;
