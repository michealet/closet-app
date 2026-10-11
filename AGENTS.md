<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — rules for all AI coding agents (Codex, Claude)

## Project

closet-app — a mobile-first digital closet for photographing the clothes you own, combining them into outfits on a visual canvas, and planning what to wear.

Product requirements: `docs/specs/FRD.md`. Technical decisions: `docs/decisions/`.

## Stack (do not change without an ADR in docs/decisions/)

Next.js 16 App Router + TypeScript strict, pnpm 12, Node 24, Tailwind + shadcn/ui (Base UI), Supabase (Postgres, Auth, Storage), Zod, Vitest + Testing Library, Playwright.

## Workflow

- Every change is a PR against `main`. Put "Closes #N" in the description for the issue it implements (or name the FRD step, see below), and fill in the PR template.
- One feature per PR. Keep PRs small (aim for < 400 changed lines, excluding `pnpm-lock.yaml`).
- Before opening or updating a PR, run: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- CI also runs `pnpm test:db` (RLS tests) and `pnpm test:e2e` (Playwright). They need Docker/Supabase, so you may not be able to run them; if CI fails, read the logs, fix the cause and push to the same branch.
- If the feature needs a database change, stop and describe the change in the PR description (tables, columns, who may read/write). DevOps writes and merges the migration first; then the feature PR continues.

### "Build the next step of the FRD"

When asked to build the next step (no issue needed):

1. Open the build order in `docs/specs/FRD.md` §16 and take the **first row that isn't ✅ done**. Build only that step. If its status says "part N of M", build the next part.
2. Read that step's requirement IDs in the FRD, and `src/lib/constants.ts`, `src/types/database.ts` and `src/lib/images/` before writing code.
3. **Stop before writing code** if the step needs a database change (a table or column that doesn't exist in `src/types/database.ts`) or a new dependency that has no ADR in `docs/decisions/`. Explain in plain words what's needed, so Maya can pass it to Micheale. Don't create a PR.
4. If the step won't fit in one PR (< 400 changed lines), build a first part that works on its own and say what's left.
5. In the same PR, update the step's Status in §16: `✅ done`, or `part 1 of 2` (and so on).
6. In the PR description, instead of "Closes #N", write `FRD step N: <name>` and list the requirement IDs covered, and any not yet covered.

### Environment (for agents running in their own container)

- Node 24 and pnpm 12: `npm i -g pnpm@12 && pnpm install --frozen-lockfile`. Don't use corepack (it can't install pnpm 12).
- `pnpm build` needs these variables; dummy values are fine: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`.

## Where code goes

```
src/app/                  routes (authenticated app routes under app/(app)/)
src/features/<feature>/   components, server actions, schemas and tests for one feature
src/components/ui/        shadcn primitives (add with the shadcn CLI; don't hand-edit heavily)
src/components/shared/    reusable app components (ImageTile, EmptyState, BottomSheet…)
src/lib/constants.ts      fixed lists (categories, colors, seasons, occasions); must match DB enums
src/lib/validation/       shared Zod schemas
e2e/                      Playwright tests (*.spec.ts)
```

Unit and component tests sit next to the code they test as `*.test.ts` / `*.test.tsx`.

## Code rules

- Use Server Components by default; add "use client" only when needed.
- Data access goes through `src/lib/supabase/*` (`server.ts` in server code, `client.ts` in the browser). Never create ad-hoc clients.
- Data changes go through Server Actions that validate input with Zod and return `ActionState` (`src/lib/action-state.ts`).
- Authorization is enforced by row-level security in the database, not only in the UI. Never use the service-role key in app code.
- Auth is email + password (ADR 0001). Don't add other sign-in methods without an ADR.
- Use pnpm only. Never commit `package-lock.json` or `yarn.lock`.
- No new dependencies without explaining why in the PR description.
- Add or update tests for any logic you add.

## Data and storage

- Tables: `clothing_items`, `outfits`, `outfit_items` (canvas layout, 0–1 coordinates), `planned_outfits`. Types come from `src/types/database.ts`; labels for the fixed lists from `src/lib/constants.ts`.
- Don't pass `user_id` on insert; the database fills it in from the signed-in user.
- Images go in the private `closet` bucket under the owner's folder: `{user_id}/items/{item_id}.{webp|jpg}`, `{user_id}/items/{item_id}_thumb.{webp|jpg}`, `{user_id}/outfits/{outfit_id}.{webp|jpg}`. WebP or JPEG (Safari can't encode WebP), at most 5 MB.
- Process and upload photos only through `src/lib/images/` (ADR 0002): resized and rotated in the browser, uploaded straight to Storage, then the row is saved by a Server Action. Never send image files through a Server Action.
- Show images with short-lived signed URLs (`createSignedUrls` for grids), never public URLs. Use thumbnails in grids and cards.
- When deleting an item or outfit, also delete its files from storage. Deleting the row doesn't remove them.

## UI rules (FRD §14–15)

- Mobile-first; tap targets at least 44px; works one-handed on a phone.
- Use shadcn/ui components and theme variables (Tailwind tokens) before writing custom UI. No hard-coded colors.
- Every mutation shows loading, success and error states (toasts via `sonner`). No silent failures.
- Images have alt text (the item name); keep readable contrast and keyboard access on desktop.

## Hard "do not touch" rules (owned by DevOps — request changes in the PR description instead)

- `supabase/**` (migrations, tests, config, seed) — describe the schema change you need; DevOps writes the migration and its RLS tests.
- `.github/**`, `src/proxy.ts`, `src/lib/supabase/**`, `next.config.*`, `package.json` scripts/engines, `vitest.config.*`, `playwright.config.*`.
- `AGENTS.md`, `CLAUDE.md`, `.env.example` (new environment variables must also be set up in Vercel by DevOps).
- Never commit secrets, `.env*` files (except `.env.example`), or the Supabase service-role key.
- Never disable RLS, lint rules, type checks or tests to make something pass.
- Never edit `src/types/database.ts` by hand (it is generated by `pnpm db:types`).
