# 0001. Email + password sign-in instead of magic links

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

The bootstrap spec called for email magic-link sign-in. Testing it on the hosted project showed three problems:

- Supabase's built-in email sender allows about 2 auth emails per hour for the whole project, and preview and production share one project.
- With PKCE, a magic link only works in the browser that requested it. On phones, mail apps often open links in a different browser, so sign-in fails.
- Vercel's preview login interrupted the link flow long enough for links to expire.

## Decision

Use Supabase email + password sign-in and sign-up, with **Confirm email** turned off. Passwords are 8–72 characters. `/auth/callback` stays for a future password reset or OAuth provider.

## Consequences

- Sign-in sends no email, so the email rate limit no longer matters, and it works the same on local, preview and production.
- Email addresses aren't verified. That's acceptable while each user can see only her own data.
- There's no "forgot password" yet. Adding it needs an email per reset, which the built-in sender can handle at low volume. Revisit with custom SMTP if volume grows.
- Google sign-in can be added later as a second option (needs its own ADR).
