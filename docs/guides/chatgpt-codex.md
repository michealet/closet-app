# Using Codex in ChatGPT for closet-app

A step-by-step guide for Maya. Everything here happens in **ChatGPT** (website or phone app) and **GitHub**. You never need the command line or to install anything.

For how the whole process fits together (issues, checks, previews, approving), see [Maya's guide in the README](../../README.md#mayas-guide).

> Codex's screens change from time to time. If a button below has a slightly different name, look for the closest match, or ask Micheale.

---

## What you need

- A ChatGPT plan that includes **Codex** (check that Codex appears in your ChatGPT sidebar).
- Your GitHub account, **mayatp2331**, which already has access to `michealet/closet-app`.

---

## One-time setup (about 15 minutes, with Micheale)

### 1. Connect GitHub

Codex needs two separate permissions on GitHub:

- **The Codex app is installed on closet-app.** Only the repository's owner can do this, so Micheale has done it once for everyone. You can't, because the repository belongs to his account.
- **You authorize Codex for your own account.** Codex then works as `mayatp2331`, with your access, and your pull requests show your name.

1. In ChatGPT, open **Codex** (in the sidebar, or go to https://chatgpt.com/codex).
2. When asked, **connect GitHub** and sign in as `mayatp2331`.
3. If GitHub offers to **install** the app or asks which repositories to give it, don't pick anything there: that would install it on your own repositories. Just **authorize** and continue.
4. Check that **michealet/closet-app** appears in Codex's repository list. If it doesn't, ask Micheale to check the app is still installed on closet-app.

### 2. Create the environment

Codex builds the app in its own cloud computer, which needs to know how to set the project up.

1. In Codex's settings, find **Environments** and create one for **closet-app**.
2. **Setup script**: paste exactly:
   ```
   npm i -g pnpm@12 && pnpm install --frozen-lockfile
   ```
3. If there's a Node.js version setting, choose **24**.
4. **Environment variables**: add these two. They're harmless placeholders; Codex never touches the real app or its data.

   | Name                            | Value                    |
   | ------------------------------- | ------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `http://127.0.0.1:54321` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `dummy`                  |

5. Leave **internet access** at its default unless Micheale says otherwise.
6. Save.

### 3. Try a practice task

This checks that everything works, end to end, with a tiny change.

1. Start a new task. Where it asks where to run, choose **Cloud** (the closet-app environment), **not "This computer"**: that would run on your own laptop, which isn't set up for it. Pick the **closet-app** repository, branch **main**, and type:
   > Change the subtitle on the Home page from "What are we wearing today?" to "What should I wear today?", following AGENTS.md.
2. Wait for Codex to finish. It shows a summary, the changed files and whether its checks passed.
3. Click the button to **create a pull request**.
4. On GitHub, follow steps 3–5 of [Maya's guide](../../README.md#mayas-guide): wait for the green checks, open the preview, then approve.

If the checks are green and the preview shows the new subtitle, you're set up. (Whether we keep the new wording is up to you.)

---

## Everyday use

### Building a feature from an issue

1. Make sure the issue exists on GitHub (with the **Feature** template) and note its number, for example **#20**.
2. If you answered **Yes** or **Not sure** to "Does this need new data stored?", wait until Micheale says the database part is ready.
3. In Codex, start a new task in **Cloud** (not "This computer"), pick **closet-app** and type:
   > Implement issue #20 following AGENTS.md.
4. When it's done, read its summary. If it says it **stopped because the feature needs a database change**, don't create a pull request; tell Micheale (comment on the issue mentioning @michealet).
5. Otherwise, **create the pull request** and continue on GitHub.

Use **one Codex task per issue**. Start a new task for the next feature instead of continuing an old one.

### Messages to copy

| Situation                                | What to type in Codex                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Build a feature                          | `Implement issue #20 following AGENTS.md.`                                                                                   |
| Checks failed (red ✗) on the PR          | `The checks failed on the pull request. Read the failures, fix them and update the same pull request.`                       |
| You asked for changes in your review     | `Address the review comments on the pull request for issue #20 and update the same pull request.`                            |
| Small tweak after testing the preview    | `On the pull request for issue #20, make the "Save" button full width on phones. Update the same pull request.`              |
| Understand something without changing it | `Without changing any code: where is the Add clothing page, and what happens when I tap Save?` (use **Ask** mode if offered) |

Be specific about what you see and what you expect, the way you'd describe it to a person: which page, which button, on phone or computer.

### Fixing things on an existing pull request

Go back to **the same Codex task** that created the pull request and ask for the change there. Codex then updates the **same** pull request, and the checks and preview refresh automatically. Creating a new pull request for a fix makes things confusing.

### On your phone

The ChatGPT phone app includes Codex. It's handy for starting a task or checking progress. Reviewing and approving is easiest in the **GitHub** app or website.

---

## The house rules Codex follows

Codex reads [`AGENTS.md`](../../AGENTS.md) automatically. In plain words, it will:

- Keep each pull request to one feature, and add tests.
- Use the app's existing design (colors, fonts, buttons), and make every screen work on a phone first.
- **Not** change the database, security, automation or project settings. Those are Micheale's. If a feature needs them, Codex stops and explains what's needed.
- **Not** add new software packages without explaining why in the pull request.

If a pull request changes one of Micheale's areas anyway, GitHub automatically asks Micheale to review it. You'll see her listed as a required reviewer.

---

## When something goes wrong

| What you see                                                            | What to do                                                                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Codex says you don't have access to closet-app, or you're not the owner | Micheale installs the Codex app on closet-app (only he can). Then reconnect GitHub in Codex and authorize; don't install it yourself. |
| Codex says the setup failed, or it can't install or run anything        | The environment needs checking. Ask Micheale to look at the setup script and variables above.                                         |
| Checks stay red after two tries                                         | Comment on the pull request: "@michealet the checks keep failing, can you take a look?"                                               |
| Codex says it needs a database change                                   | Don't create a pull request yet. Comment on the issue mentioning @michealet, with what Codex said.                                    |
| The pull request says it **can't be merged because of conflicts**       | Ask Codex: `Update the pull request with the latest main and resolve the conflicts.` If it still conflicts, ask Micheale.             |
| The preview doesn't show your change                                    | Wait a minute and reload. Vercel rebuilds after every update. Check the Vercel comment on the pull request for the latest link.       |
| You're not sure Codex understood                                        | Ask it to explain its plan before changing code: `Before writing code, describe your plan for issue #20.`                             |

---

## Please don't

- Paste passwords, keys, or anything secret into Codex, issues or comments.
- Give Codex access to other GitHub repositories.
- Ask Codex to change the database, GitHub settings or `AGENTS.md`. Ask Micheale instead.
- Merge a pull request with a red ✗, or one you haven't tried on the preview.
