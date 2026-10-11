# Functional Requirements — ReWear, Digital Closet & Outfit Planner (MVP)

|                       |                                                                    |
| --------------------- | ------------------------------------------------------------------ |
| **Product Owner**     | Maya                                                               |
| **DevOps / Platform** | Micheale                                                           |
| **Status**            | v1.0 — starting FRD                                                |
| **Location in repo**  | `docs/specs/FRD.md`                                                |
| **Related**           | `PROJECT_SPEC.md` (stack, repo, CI), `AGENTS.md` (AI coding rules) |

> **For AI agents:** This is the source of truth for _what_ to build. `PROJECT_SPEC.md` and `AGENTS.md` define _how_. Requirement IDs (e.g. `CL-3`) should be referenced in Issues, PRs and tests. If something here conflicts with `AGENTS.md`, `AGENTS.md` wins — raise the conflict in the PR.

---

## 1. Product Vision

A personal wardrobe app where the user uploads photos of the clothing she owns, organizes them, and puts together outfits visually. It should feel **clean, feminine, modern and very visual**, like Pinterest, Depop or a digital closet.

**Primary device: mobile.** Most clothing photos will be uploaded from a phone, so every screen must be designed mobile-first and must also work well on desktop.

### Core capabilities

1. Upload photos of clothing
2. Organize clothing into categories
3. Browse the full closet
4. Combine items into outfits on a visual canvas
5. Save, favorite, edit, duplicate and delete outfits
6. Plan outfits for specific dates and events
7. Edit or delete clothing and outfits easily

---

## 2. Users & Accounts

| ID   | Requirement                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AU-1 | Each user has a private account and signs in with email and password (see `PROJECT_SPEC.md` Phase 2). Email confirmation is off for the MVP.     |
| AU-2 | Each user sees only her own clothing, outfits, plans and images. This is enforced by row-level security and private storage, not only in the UI. |
| AU-3 | Data persists across refreshes, devices and sessions.                                                                                            |

---

## 3. Navigation & Layout

| ID   | Requirement                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| NV-1 | Primary nav: **Home · Closet · Outfits · Calendar · Profile**.                                                                                  |
| NV-2 | Mobile: a fixed bottom tab bar with icon and label. Desktop: a sidebar or top nav.                                                              |
| NV-3 | "Add Clothing" and "Create Outfit" can be reached from anywhere in at most 2 taps (for example, a floating "+" button that opens both options). |
| NV-4 | Every page has a URL (deep-linkable), and the browser Back button works as expected.                                                            |

---

## 4. Home Screen

| ID   | Requirement                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------- |
| HM-1 | Welcome/header area with the user's display name.                                                         |
| HM-2 | Prominent **Create an Outfit** and **Add Clothing** buttons.                                              |
| HM-3 | **Recently created outfits**: a horizontal scroll of the latest 10.                                       |
| HM-4 | **Favorite outfits**: a horizontal scroll.                                                                |
| HM-5 | **Upcoming planned outfits**: the next 7 days of calendar entries.                                        |
| HM-6 | Empty states for a new user, with friendly guidance (e.g. "Your closet is empty — add your first piece"). |

---

## 5. Digital Closet

| ID   | Requirement                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CL-1 | Show all clothing in a visual image grid: 2 columns on mobile, 4–6 on desktop. The image is the focus, with the name shown small underneath and a heart icon. |
| CL-2 | **Search bar** that matches name, brand, color, tags and notes.                                                                                               |
| CL-3 | **Filters:** Category, Color, Season, Brand, Tag, Favorites. Filters combine with AND. The active filters show as removable chips.                            |
| CL-4 | Category quick-tabs or chips across the top (All, Tops, Bottoms, …).                                                                                          |
| CL-5 | Tapping an item opens its Item Detail page (§7).                                                                                                              |
| CL-6 | Sort options: newest first (the default), name A–Z.                                                                                                           |

### Categories (fixed list for MVP)

Tops · Bottoms · Dresses · Sets · Jackets/Outerwear · Shoes · Bags · Accessories · Jewelry

### Seasons

Spring · Summer · Fall · Winter · All Season (multi-select; choosing "All Season" means all four)

### Colors

A preset palette shown as swatches (multi-select: an item can have several colors): Black, White, Cream, Beige, Brown, Gray, Navy, Blue, Green, Olive, Yellow, Orange, Red, Pink, Purple, Gold, Silver, Multi/Pattern.

---

## 6. Add / Edit Clothing

| ID    | Requirement                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | **Add Item** flow on one mobile-friendly form.                                                                                                                  |
| AC-2  | **Photo** (required): upload from the camera roll or take a photo with the camera on mobile. Accept JPEG, PNG, WebP and HEIC.                                   |
| AC-3  | Before upload, the image is resized and compressed on the device (longest edge ≤ 1600px, WebP/JPEG) and phone-rotation (EXIF orientation) is corrected.         |
| AC-4  | **Name** (optional: if left empty, it's made from the details, e.g. "Navy Zara dress"; #36) and **Category** (required, from the fixed list).                   |
| AC-5  | **Brand** (optional, free text, suggesting brands already used).                                                                                                |
| AC-6  | **Colors** (optional, swatch picker, multi-select).                                                                                                             |
| AC-7  | **Seasons** (optional, multi-select).                                                                                                                           |
| AC-8  | **Notes** (optional, up to 500 characters).                                                                                                                     |
| AC-9  | **Save** shows a success toast and returns to the Closet with the new item visible.                                                                             |
| AC-10 | The same form is used for **Edit**, pre-filled. The photo can be replaced.                                                                                      |
| AC-11 | A user can add several items in a row without navigating away ("Save & add another").                                                                           |
| AC-12 | **Background removal is a future feature.** Design the image pipeline so a processed version of the image can be stored alongside the original later (see §13). |
| AC-13 | **Tags** (optional, free words such as "linen" or "thrifted", suggesting tags already used; at most 20, each up to 30 characters; #36).                         |

---

## 7. Item Detail

| ID   | Requirement                                                                                                                                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID-1 | Large image, name, category, brand, color, seasons and notes.                                                                                                                                                     |
| ID-2 | Heart toggle for favorite.                                                                                                                                                                                        |
| ID-3 | An **Outfits Using This Item** section showing outfit cards that link to each outfit.                                                                                                                             |
| ID-4 | **Edit** and **Delete** buttons.                                                                                                                                                                                  |
| ID-5 | Delete asks for confirmation. If the item is used in outfits, the warning says how many ("This item is in 3 outfits. It will be removed from them."). After deletion, those outfits remain with the item removed. |

---

## 8. Outfit Creator ⭐ (most important feature)

| ID    | Requirement                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OC-1  | Two-part layout: an **outfit canvas** plus a **closet picker**. On mobile, the canvas is at the top and the picker is a bottom sheet or drawer. On desktop, they sit side by side. |
| OC-2  | The picker shows clothing grouped or filtered by category, with search.                                                                                                            |
| OC-3  | Tapping an item in the picker adds it to the canvas; tapping it again removes it. Selected items are marked in the picker.                                                         |
| OC-4  | Items on the canvas can be **dragged** to reposition them with touch or mouse.                                                                                                     |
| OC-5  | Items on the canvas can be **resized** (corner handle on desktop, pinch or handle on mobile), keeping their aspect ratio.                                                          |
| OC-6  | Items can be brought forward or sent backward (layer order), and removed from the canvas.                                                                                          |
| OC-7  | Placement uses **coordinates relative to the canvas** (0–1), so a saved outfit looks the same on any screen size.                                                                  |
| OC-8  | New items are placed automatically in sensible default spots by category (e.g. top upper-center, bottoms middle, shoes bottom, bag and jewelry at the sides).                      |
| OC-9  | **Save** opens a form with: **Name** (required), **Occasion** (optional), **Seasons** (optional, multi-select), **Notes** (optional) and **Favorite** toggle.                      |
| OC-10 | When saved, a **thumbnail image** of the canvas is generated and stored for use on outfit cards.                                                                                   |
| OC-11 | The same canvas is used to **edit** an existing outfit.                                                                                                                            |
| OC-12 | A warning appears when leaving the creator with unsaved changes.                                                                                                                   |
| OC-13 | "Create Outfit" can also be started from an Item Detail page with that item already on the canvas.                                                                                 |

### Occasions (fixed list for MVP)

Casual · Class · Going Out · Dinner · Formal · Work · Vacation · Date Night · Party · Workout · Other

---

## 9. Saved Outfits

| ID   | Requirement                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| OU-1 | Outfits page: a grid of outfit cards (thumbnail, name, occasion tag, heart).                                                                          |
| OU-2 | **Filters:** Favorites, Occasion, Season.                                                                                                             |
| OU-3 | Tapping a card opens Outfit Detail: a large canvas view, its details, and the list of items (each links to Item Detail).                              |
| OU-4 | Actions: **Edit**, **Delete** (with confirmation), **Favorite**, **Duplicate** (creates "Copy of …" and opens it in the creator), **Assign to date**. |
| OU-5 | Deleting an outfit also removes its calendar entries, after a warning.                                                                                |

---

## 10. Outfit Calendar

| ID   | Requirement                                                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------- |
| CA-1 | Month view. Days with a plan show a small outfit thumbnail (or a dot on narrow screens).                                   |
| CA-2 | Tapping a date shows that day's plan(s): outfit thumbnail, event name and outfit name.                                     |
| CA-3 | **Plan an outfit:** pick a date, choose a saved outfit, and optionally add an **event name** (e.g. "Dinner with friends"). |
| CA-4 | Also reachable from an outfit ("Assign to date").                                                                          |
| CA-5 | A day can have more than one planned outfit (e.g. day and evening).                                                        |
| CA-6 | Plans can be edited or removed.                                                                                            |
| CA-7 | An agenda/list view of upcoming plans (also used by HM-5).                                                                 |

---

## 11. Favorites

| ID   | Requirement                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------- |
| FV-1 | Both clothing items and outfits have a heart toggle wherever they are shown (grid, card, detail).    |
| FV-2 | The heart updates instantly on screen and saves in the background, undoing itself if the save fails. |
| FV-3 | "Favorites" filter on the Closet and Outfits pages, and a favorites section on Home.                 |

---

## 12. Profile / Settings (MVP-light)

| ID   | Requirement                                                          |
| ---- | -------------------------------------------------------------------- |
| PR-1 | Edit display name.                                                   |
| PR-2 | Sign out.                                                            |
| PR-3 | Closet stats: number of items, outfits and favorites (nice to have). |

---

## 13. Data Model

Maya's suggested entities are mapped to Postgres/Supabase below. The main change is that an outfit's item list and canvas positions are stored as one **join table**. That keeps them in sync automatically and lets "Outfits using this item" and item deletion work cleanly.

> **Schema changes are owned by DevOps** (see `AGENTS.md`). Micheale implements this as migrations.

### `clothing_items`

| Column                  | Type                        | Notes                                    |
| ----------------------- | --------------------------- | ---------------------------------------- |
| id                      | uuid PK                     |                                          |
| user_id                 | uuid FK → auth.users        | row-level security owner                 |
| name                    | text, required              |                                          |
| category                | enum `clothing_category`    | fixed list, §5                           |
| brand                   | text, null                  |                                          |
| colors                  | `clothing_color[]`          | preset palette, §5; several allowed      |
| color                   | enum `clothing_color`, null | deprecated (use `colors`); to be dropped |
| seasons                 | `season[]`                  | Spring/Summer/Fall/Winter                |
| tags                    | `text[]`                    | lowercase, ≤ 20 × 30 chars (#36)         |
| notes                   | text, null                  | ≤ 500 chars                              |
| image_path              | text, required              | Supabase Storage path (original)         |
| thumbnail_path          | text, null                  | small version for grids (NF-2)           |
| image_processed_path    | text, null                  | **future:** background-removed version   |
| is_favorite             | boolean, default false      |                                          |
| created_at / updated_at | timestamptz                 |                                          |

### `outfits`

| Column                  | Type                   | Notes                          |
| ----------------------- | ---------------------- | ------------------------------ |
| id                      | uuid PK                |                                |
| user_id                 | uuid FK                |                                |
| name                    | text, required         |                                |
| occasion                | enum `occasion`, null  | fixed list, §8                 |
| seasons                 | `season[]`             |                                |
| notes                   | text, null             |                                |
| thumbnail_path          | text, null             | generated at save time (OC-10) |
| is_favorite             | boolean, default false |                                |
| created_at / updated_at | timestamptz            |                                |

### `outfit_items` (replaces `clothingItemIds[]` + `canvasPositions`)

| Column           | Type                                        | Notes                                                  |
| ---------------- | ------------------------------------------- | ------------------------------------------------------ |
| outfit_id        | uuid FK → outfits, on delete cascade        |                                                        |
| clothing_item_id | uuid FK → clothing_items, on delete cascade | makes ID-5 work                                        |
| x, y             | numeric (0–1)                               | position relative to the canvas                        |
| width            | numeric (0–1)                               | relative width; height follows the image's proportions |
| z_index          | int                                         | layer order                                            |
| PK               | (outfit_id, clothing_item_id)               | an item appears once per outfit                        |

### `planned_outfits`

| Column     | Type                                 | Notes |
| ---------- | ------------------------------------ | ----- |
| id         | uuid PK                              |       |
| user_id    | uuid FK                              |       |
| outfit_id  | uuid FK → outfits, on delete cascade |       |
| date       | date                                 |       |
| event_name | text, null                           |       |
| created_at | timestamptz                          |       |

### Storage

- A private bucket `closet` with paths `{user_id}/items/{item_id}.{webp|jpg}`, `{user_id}/items/{item_id}_thumb.{webp|jpg}` and `{user_id}/outfits/{outfit_id}.{webp|jpg}` (JPEG where the browser can't encode WebP; see ADR 0002). Supabase's on-the-fly image resizing needs a paid plan, so thumbnails are made on the device at upload time.
- Storage policies: users can read and write only under their own `{user_id}/` prefix. Images are shown through short-lived signed URLs.

---

## 14. Design Requirements

| ID   | Requirement                                                                                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-1 | Look and feel: **modern, feminine, minimal, clean, fashion-focused**, and not corporate.                                                                                |
| DS-2 | Palette: white and cream backgrounds, soft neutrals, one muted accent (sage green). Colors are defined as theme variables in Tailwind/shadcn so they're easy to adjust. |
| DS-3 | Rounded cards (≈ 16px radius), subtle shadows, generous whitespace.                                                                                                     |
| DS-4 | Simple typography: an elegant serif or display font for headings and a clean sans-serif for body text (via `next/font`).                                                |
| DS-5 | **Clothing images are the hero.** They sit on a consistent light background tile with minimal text overlay.                                                             |
| DS-6 | Mobile-first. Tap targets are at least 44px, and the layout is designed for one-handed use on a phone.                                                                  |
| DS-7 | Smooth, subtle motion (card hover and press, bottom sheets). No heavy animations.                                                                                       |
| DS-8 | Accessibility basics: alt text from the item name, readable contrast, keyboard access on desktop.                                                                       |

---

## 15. Non-Functional Requirements

| ID   | Requirement                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| NF-1 | **Functional app, not a mockup.** All the MVP flows work end-to-end with real, persistent data.                 |
| NF-2 | The Closet grid loads quickly with 300+ items: lazy-load images, use thumbnails, paginate or scroll infinitely. |
| NF-3 | Works on current iOS Safari, Android Chrome and desktop Chrome, Safari and Edge.                                |
| NF-4 | The code is organized by feature so new features can be added easily (see §17).                                 |
| NF-5 | Can be installed as a PWA ("Add to Home Screen") — nice to have for MVP.                                        |
| NF-6 | Every mutation shows loading, success and error states. There are no silent failures.                           |

---

## 16. MVP Build Order (one PR per step, or smaller)

"Build the next step of the FRD" means the first row below that isn't ✅ (see AGENTS.md). Each PR updates its row.

| #   | Feature                                                                   | Requirement IDs  | Status  |
| --- | ------------------------------------------------------------------------- | ---------------- | ------- |
| 0   | Schema, storage bucket, app shell, navigation, design tokens _(Micheale)_ | §13, NV-_, DS-_  | ✅ done |
| 1   | Add clothing (upload, form, save)                                         | AC-*             | ✅ done |
| 2   | Digital closet grid + Item Detail                                         | CL-1, CL-5, ID-* | ✅ done |
| 3   | Categories, filters, search                                               | CL-2–4, CL-6     | to do   |
| 4   | Outfit creator (canvas, drag, resize)                                     | OC-1–8, OC-11–13 | to do   |
| 5   | Save outfits + thumbnails                                                 | OC-9, OC-10      | to do   |
| 6   | Saved outfits page + actions                                              | OU-*             | to do   |
| 7   | Favorites (items + outfits)                                               | FV-*             | to do   |
| 8   | Outfit calendar                                                           | CA-*             | to do   |
| 9   | Home screen (uses all of the above)                                       | HM-*             | to do   |
| 10  | Profile / settings                                                        | PR-*             | to do   |

---

## 17. Code Organization (for extensibility)

```
src/
├── app/(app)/            # authenticated routes: home, closet, outfits, calendar, profile
├── features/
│   ├── closet/           # components, hooks, server actions, schemas for clothing
│   ├── outfits/          # outfit creator canvas, outfit cards, actions
│   ├── calendar/
│   └── favorites/
├── components/ui/        # shadcn primitives
├── components/shared/    # ImageTile, HeartButton, FilterChips, EmptyState, BottomSheet
└── lib/
    ├── supabase/
    ├── images/           # resize/compress/HEIC; future: background-removal hook
    └── constants.ts      # categories, colors, seasons, occasions (single source)
```

- The fixed lists (categories, colors, seasons, occasions) are defined **once** in `lib/constants.ts` and must match the database enums.
- Data changes go through Server Actions validated with Zod.
- The canvas should use a proven drag/resize library (e.g. `react-rnd` or `react-konva`). Record the choice in an ADR in `docs/decisions/`.

---

## 18. Future Features (out of scope for MVP — design so they fit later)

- Automatic background removal (the `image_processed_path` column is already reserved)
- AI outfit recommendations
- Automatic clothing detection and auto-fill (category, color)
- Weather-based suggestions
- Packing lists for trips
- Wear tracking ("last worn", cost-per-wear)
- Sharing outfits with friends

---

## 19. Open Questions (answered by Maya, #11 and #12)

1. **Colors:** one primary color per item, or several? **Several** (plus "Multi/Pattern" for patterns).
2. **Outfit seasons:** one season or several? **Several**, to match items.
3. **Calendar:** more than one outfit per day allowed? **Yes.**
4. **Custom categories or occasions** defined by the user: needed for MVP, or later? **Later**; fixed lists for the MVP.
5. **App name** and accent color preference? **ReWear** (exactly this spelling) and **sage green**.
6. **Sharing:** strictly private, or will outfits ever be shared? **Private** for now.

---

## 20. MVP Acceptance (Definition of Done)

- [ ] On a phone, the user can photograph a piece of clothing and save it with its details in under 30 seconds.
- [ ] The closet shows every item, and search and all five filters work together.
- [ ] The user can build an outfit from 5 or more items, drag and resize them, save it, and reopen it with the same layout on a different device.
- [ ] Outfits can be edited, duplicated, favorited, deleted and assigned to dates.
- [ ] The calendar shows planned outfits, and tapping a date shows the plan.
- [ ] Deleting an item removes it from its outfits cleanly, after a warning.
- [ ] Data persists after refresh and sign-out/sign-in. One user cannot see another user's data.
- [ ] The layout works on iPhone-sized screens and on desktop.
