@AGENTS.md

## DevOps notes (Claude only)

- You may modify DevOps-owned paths when Micheale asks.
- Preview and production share one Supabase project, and migrations reach it only when merged to `main`. So:
  - **Schema first:** a schema change lands in its own small PR, merged before the feature PR that uses it.
  - **Additive only:** add tables and columns; don't rename or drop anything the deployed app still uses. Remove old things in a later PR, once nothing references them.
- Schema changes: `pnpm exec supabase migration new <name>` → write SQL (with RLS policies) → add or extend a pgTAP test in `supabase/tests/database/` → `pnpm exec supabase db reset` → `pnpm test:db` → `pnpm db:types` → commit the migration, test and types together.
- When reviewing Codex PRs: check AGENTS.md compliance, security (RLS, input validation, secrets), and test coverage first.
