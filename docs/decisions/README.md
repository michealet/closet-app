# Architecture decision records

Short notes on technical decisions, so later readers (and AI agents) know what was chosen and why. `AGENTS.md` requires one before changing the stack.

- Name files `NNNN-short-title.md`, numbered in order. Never renumber or delete; mark an outdated record **Superseded by NNNN** instead.
- Keep each record to about a page.

## Template

```markdown
# NNNN. Title

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD

## Context

What problem or constraint forced a decision.

## Decision

What we chose.

## Consequences

What gets easier, what gets harder, and what we'll revisit.
```

## Index

- [0001. Email + password sign-in instead of magic links](0001-email-password-auth.md)
