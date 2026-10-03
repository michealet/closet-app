# closet-app — Digital Closet & Outfit Planner

A mobile-first digital closet for photographing the clothes you own, combining them into outfits on a visual canvas, and planning what to wear.

- **Production:** https://closet-app-five-eosin.vercel.app
- **What we're building:** [`docs/specs/FRD.md`](docs/specs/FRD.md) (requirements, data model and MVP build order)
- **Rules for AI agents (Codex and Claude):** [`AGENTS.md`](AGENTS.md)
- **Technical decisions:** [`docs/decisions/`](docs/decisions/)

> **Status:** The foundation is done: sign-in, an account page, CI, preview deploys and database migrations. The closet features in the FRD are next, starting with build step 0 (data model, storage, app shell and design tokens).

## Team

| Who                                    | Role             | Tools                                                                                           |
| -------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **Maya Taylor-Prince** (`@mayatp2331`) | Product owner    | Writes features as GitHub Issues; builds them with ChatGPT Codex; tests on Vercel preview URLs  |
| **Micheale** (`@michealet`)            | DevOps, platform | Owns the repo, CI/CD, environments, database schema, security and code review; uses Claude Code |

Every change lands through a pull request that passes CI. Both AIs follow the same rules file, `AGENTS.md`.

## Stack

Next.js 16 (App Router, TypeScript strict) · pnpm 12 · Node 24 · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, Storage) · Zod · Vitest + Testing Library · Playwright · Vercel · GitHub Actions

## Maya's workflow

Maya needs no local setup.

1. **Write an Issue** with the **Feature** template (or **Bug** for problems). Fill in the user story, acceptance criteria and FRD requirement IDs. Answer **"Does this need new data stored?"** honestly: if yes, Micheale adds the database change first (see [Database changes](#database-changes)).
2. **Ask Codex to build it:** "Implement issue #N following AGENTS.md."
3. **Open the PR** from Codex. Check that it says "Closes #N" and fill in the PR template.
4. **Wait for the checks.** GitHub runs `quality`, `db` and `e2e`. If one fails, ask Codex to read the failure and fix it on the same branch.
5. **Test on the preview.** Vercel comments on the PR with a preview URL. Try every acceptance criterion there, on your phone too.
6. **Request review** from Micheale, who approves and merges. Merging deploys to production automatically.

> Previews and production share **one database**, so anything you create while testing a preview is real data. Use a test account.

### Questions and decisions

Product questions go on GitHub, not chat. Use the **Question** issue template; it's assigned to Maya and labelled `question` (filter: `is:open label:question`). Answer in a comment; whoever asked records the answer (FRD, ADR or the linked issue) and closes it.

### One-time Codex setup

Codex works in its own cloud environment. In Codex's environment settings for this repo:

- **Setup script:** `npm i -g pnpm@12 && pnpm install --frozen-lockfile` (Node 24). Don't rely on corepack; it can't install pnpm 12.
- **Environment variables** (dummy values are fine; Codex never talks to the real database):
  - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`

Codex can run `pnpm format:check`, `lint`, `typecheck`, `test` and `build`. The database and browser tests need Docker, so they run in CI only.

## Micheale's local setup

### Prerequisites

- **Node 24** (pinned in `.nvmrc`): `nvm install 24 && nvm use 24`
- **pnpm 12** (pinned in `package.json`): `npm i -g pnpm@12`
- **Docker:** [OrbStack](https://orbstack.dev) on macOS (lighter than Docker Desktop). If the project lives under `~/Documents`, give OrbStack access to the Documents folder (System Settings → Privacy & Security → Files and Folders), or `supabase test db` can't read the tests.
- **Supabase CLI:** installed with the project (`pnpm exec supabase …`); no global install needed.

### Run it

```sh
pnpm i
pnpm exec supabase start      # local Postgres, Auth and Studio in Docker
cp .env.example .env.local    # then paste the publishable/anon key from `pnpm exec supabase status`
pnpm dev                      # http://localhost:3000
```

Local Supabase Studio runs at http://127.0.0.1:54323. Sign up on `/login` with any email and an 8+ character password; no email is sent.

### Scripts

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `pnpm dev`          | Dev server                                                    |
| `pnpm build`        | Production build                                              |
| `pnpm format:check` | Prettier check (`pnpm format` to fix)                         |
| `pnpm lint`         | ESLint                                                        |
| `pnpm typecheck`    | Route types + `tsc --noEmit`                                  |
| `pnpm test`         | Unit and component tests (Vitest)                             |
| `pnpm test:e2e`     | Smoke tests in a real browser (Playwright; reuses `pnpm dev`) |
| `pnpm test:db`      | Row-level security tests (pgTAP; needs `supabase start`)      |
| `pnpm db:types`     | Regenerate `src/types/database.ts` from the local database    |

## Database changes

Previews and production share one Supabase project, and migrations reach it only when merged to `main`. So schema changes are **schema-first** and **additive only**:

1. Maya describes the data she needs in the Issue ("Does this need new data stored?").
2. Micheale writes the migration in its **own PR**:
   ```sh
   pnpm exec supabase migration new <name> </dev/null   # creates supabase/migrations/<timestamp>_<name>.sql
   # write the SQL, including RLS policies
   # add or extend a test in supabase/tests/database/
   pnpm exec supabase db reset
   pnpm test:db
   pnpm db:types
   ```
   Commit the migration, the test and `src/types/database.ts` together.
3. Merging that PR runs **`db-migrate.yml`**, which applies the migration to production. It can also be run by hand from the Actions tab.
4. Then the feature PR that uses the new tables goes ahead.

Only add tables and columns. Don't rename or drop anything the deployed app still uses; remove old things in a later PR once nothing references them. `supabase/**` is DevOps-owned, so Codex never writes migrations.

## Environments

| Environment    | App                                              | Database                                    | Deploys                                                |
| -------------- | ------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------ |
| **Local**      | http://localhost:3000                            | Local Supabase in Docker (`supabase start`) | —                                                      |
| **Preview**    | One Vercel URL per PR (`*-leopard10.vercel.app`) | The hosted Supabase project (shared)        | Every push to a PR                                     |
| **Production** | https://closet-app-five-eosin.vercel.app         | The hosted Supabase project (shared)        | Every merge to `main`; migrations via `db-migrate.yml` |

- **Secrets:** Vercel holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production and Preview). The GitHub `production` environment holds `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_REF`, and only `main` can use them. Never commit `.env*` files (except `.env.example`) or the service-role key.
- **Supabase Auth:** email + password with "Confirm email" off ([ADR 0001](docs/decisions/0001-email-password-auth.md)). Redirect URLs allow `https://*-leopard10.vercel.app/**` and `http://localhost:3000/**`.
- **Free tiers:** a free Supabase project pauses after about a week without activity; unpause it from the Supabase dashboard. Supabase's built-in email sender allows about 2 auth emails per hour.

## CI and review

- **`ci.yml`** runs on every PR and on pushes to `main`:
  - `quality`: format check, lint, typecheck, unit tests, build
  - `db`: applies all migrations to a fresh database, runs the RLS tests, and checks `database.ts` is up to date
  - `e2e`: Playwright smoke tests against a production build
- **Branch protection on `main`:** all three checks must pass, plus one approval from a code owner (Micheale). Micheale merges her own PRs with the admin bypass, since GitHub doesn't let authors approve their own PRs.
- **Dependabot** opens weekly PRs for npm packages and GitHub Actions.
