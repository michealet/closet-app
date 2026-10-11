# ReWear — Digital Closet & Outfit Planner

Repository: `closet-app`.

A mobile-first digital closet for photographing the clothes you own, combining them into outfits on a visual canvas, and planning what to wear.

- **Production:** https://closet-app-five-eosin.vercel.app
- **What we're building:** [`docs/specs/FRD.md`](docs/specs/FRD.md) (requirements, data model and MVP build order)
- **Rules for AI agents (Codex and Claude):** [`AGENTS.md`](AGENTS.md)
- **Technical decisions:** [`docs/decisions/`](docs/decisions/)

> **Status:** The foundation and FRD build step 0 are in place: sign-in, the data model and image storage, the design theme and the app layout. Next up: the closet features, starting with **Add clothing** (FRD build step 1).

## Team

| Who                                    | Role             | Tools                                                                                           |
| -------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **Maya Taylor-Prince** (`@mayatp2331`) | Product owner    | Writes features as GitHub Issues; builds them with ChatGPT Codex; tests on Vercel preview URLs  |
| **Micheale** (`@michealet`)            | DevOps, platform | Owns the repo, CI/CD, environments, database schema, security and code review; uses Claude Code |

Every change lands through a pull request that passes CI. Both AIs follow the same rules file, `AGENTS.md`.

## Stack

Next.js 16 (App Router, TypeScript strict) · pnpm 12 · Node 24 · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, Storage) · Zod · Vitest + Testing Library · Playwright · Vercel · GitHub Actions

## Maya's guide

Everything you need happens in your browser or on your phone: **ChatGPT** (website or app) for Codex, and **GitHub** (website or app) for everything else. You never need the command line or to install anything.

**New to Codex?** Start with the step-by-step [ChatGPT & Codex tutorial](docs/guides/chatgpt-codex.md): setup, a practice task, and messages you can copy.

### The pieces, in plain words

| Word                  | What it means                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| **GitHub**            | Where the app's code lives, and where we talk about the work. Everything is written down there. |
| **Issue**             | A note on GitHub describing one thing: a feature, a bug or a question.                          |
| **Codex**             | The AI in ChatGPT that writes the code for an issue.                                            |
| **Pull request (PR)** | Codex's proposed change, waiting to be checked and approved before it goes live.                |
| **Checks**            | Automatic tests GitHub runs on every PR. Green ✓ = fine, red ✗ = something needs fixing.        |
| **Preview**           | A test copy of the app with that one change in it, made automatically for every PR.             |
| **Merge**             | Accepting the PR. The change then goes live in the real app within about a minute.              |
| **Production**        | The real app: https://closet-app-five-eosin.vercel.app                                          |

### 1. Ask for a feature (or report a bug)

1. Open https://github.com/michealet/closet-app/issues and click **New issue**.
2. Choose **Feature** (something new) or **Bug** (something broken).
3. Fill in the form. For features, the most important parts are:
   - **User story**: "As a … I want … so that …"
   - **Acceptance criteria**: a checklist of what "done" looks like, things you can tap and check yourself.
   - **Does this need new data stored?** Answer honestly. If it's **Yes** or **Not sure**, Micheale sets up the storage first and tells you when you can start.
4. Click **Create**. The issue gets a number, like **#14**. You'll use it in the next step.

### 2. Have Codex build it

To build the app in the FRD's order, you don't need an issue. In Codex, just type **"Build the next step of the FRD."** Codex finds the next unfinished step, builds it, and marks it done. Then continue with step 3 below. For anything else (a bug, or an idea not in the FRD), create an issue first and:

1. Open Codex in ChatGPT (website or phone app) and pick the **closet-app** repository.
2. Type: **"Implement issue #14 following AGENTS.md."** (use your issue's number)
3. When Codex has finished, use its button to **create a pull request**.

More examples, and what to do if Codex gets stuck, are in the [ChatGPT & Codex tutorial](docs/guides/chatgpt-codex.md).

### 3. Wait for the checks

On the pull request page, scroll to the bottom. After a few minutes you'll see:

- **All green ✓**: go to step 4.
- **A red ✗**: go back to Codex and say **"The checks failed on the pull request, please fix them."** It updates the same pull request and the checks run again. If it still fails, add a comment on the PR mentioning **@michealet**.

### 4. Try the preview

1. On the pull request, find the comment from **Vercel** and click **Visit Preview**.
2. Sign in and go through every item in the issue's acceptance criteria, **on your phone** as well as a computer.

> ⚠️ Previews use the **real** database: anything you create there is real data. Use your normal account and delete test items afterwards, or use a separate test account.

### 5. Say it's ready, or ask for changes

GitHub doesn't let anyone approve their own pull request, so for yours you **comment** instead:

1. At the bottom of the pull request, write a comment:
   - **Ready**: "Tested the preview on my phone, looks good."
   - **Not yet**: say what's wrong, like a checklist. Then ask Codex to fix it in the same task ("Address the comments on the pull request"). The preview updates by itself; test it again and comment here.
2. **Micheale** then reviews the code, **approves** and **merges**. The change is live in the real app about a minute later.

### Reviewing Micheale's changes

Micheale's own pull requests (the app's look, layout and so on) need **your** approval too. You'll get an email asking for your review. Try the preview (step 4), then on the pull request click **Files changed** → **Review changes**, choose **Approve** (or **Request changes** and say what's wrong) and **Submit review**. In the GitHub phone app: **Review** → **Approve**. Pull requests that only touch the database, security or automation are Micheale's alone, so you won't be asked for those.

### Answering questions

When Micheale needs a product decision, Micheale opens a **Question** issue assigned to you. You'll get an email.

- **Easiest:** reply to the email. Your reply is posted on GitHub automatically.
- Or open the issue and write a comment at the bottom.

You don't need to close it. Micheale closes it once your answer is built in. To see everything waiting on you: https://github.com/michealet/closet-app/issues?q=is%3Aopen+label%3Aquestion

### Emails you'll get from GitHub

| Email about…                                   | What to do                                                |
| ---------------------------------------------- | --------------------------------------------------------- |
| A **Question** assigned to you                 | Reply with your answer.                                   |
| A **review requested** on a pull request       | Try the preview, then approve or request changes.         |
| A **comment from Vercel** on your pull request | Your preview is ready: open it and test (step 4).         |
| **Comments** on your issues or pull requests   | Read; reply if a question is asked.                       |
| A **pull request merged**                      | Nothing. It's live. Check it in the real app if you like. |

### Please don't

- Change repository **Settings**, or edit files directly on the GitHub website. Let Codex make changes through pull requests.
- Merge a pull request with a red ✗, or one you haven't tried on the preview.
- Paste passwords, keys or other secrets into issues, comments or Codex.
- Write anything personal in issues, pull requests or comments. **The repository is public**: anyone can read the code and what's written on GitHub. (The app's data — your clothes, photos and outfits — stays private.)

**Stuck?** Write a comment mentioning **@michealet** on the issue or pull request.

### One-time Codex setup (do this together with Micheale)

Step-by-step instructions are in the [ChatGPT & Codex tutorial](docs/guides/chatgpt-codex.md#one-time-setup-about-15-minutes-with-micheale). In short, Codex works in its own cloud environment; in Codex's environment settings for this repository:

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
- **Why the repo is public:** Vercel's free Hobby plan only builds commits by the account owner on **private** repos, so Maya's PRs and merges were blocked. On a public repo they deploy normally. Making the repo private again would need Vercel Pro ($20/month per member, Maya included) or deploys via GitHub Actions. Keep secrets out of the repo and its history.
- **Free tiers:** a free Supabase project pauses after about a week without activity; unpause it from the Supabase dashboard. Supabase's built-in email sender allows about 2 auth emails per hour.

## CI and review

- **`ci.yml`** runs on every PR and on pushes to `main`:
  - `quality`: format check, lint, typecheck, unit tests, build
  - `db`: applies all migrations to a fresh database, runs the RLS tests, and checks `database.ts` is up to date
  - `e2e`: Playwright smoke tests against a production build
- **Branch protection on `main`:** all three checks must pass, plus one approval from a code owner (`.github/CODEOWNERS`):
  - **App code** (pages, components, features, docs): Micheale **or** Maya. Maya approves Micheale's PRs and Micheale approves Maya's, so neither needs a bypass.
  - **DevOps paths** (`supabase/`, `.github/`, `src/lib/supabase/`, `src/proxy.ts`, `AGENTS.md`, `CLAUDE.md`): Micheale only. Since GitHub doesn't let authors approve their own PRs, Micheale merges these with the admin bypass.
- **Dependabot** opens weekly PRs for npm packages and GitHub Actions.
