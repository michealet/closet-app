# 0002. Process photos in the browser and upload them straight to Storage

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

FRD feature 1 (Add clothing) needs photos from phones and computers turned into something the closet grid can show quickly:

- Accept JPEG, PNG, WebP and HEIC (AC-2).
- Fix phone rotation, shrink to a longest edge of 1600px, and save as WebP or JPEG (AC-3).
- Make a small thumbnail for grids, so 300+ items load fast (NF-2).
- Leave room for a background-removed version later (AC-12).

Constraints we checked:

- **Server Actions accept 1 MB by default**, and Vercel functions about 4.5 MB. Phone photos are often 2–6 MB, so originals can't go through our server.
- **Supabase's on-the-fly image resizing needs a paid plan**, so thumbnails have to be made at upload time.
- **Safari can't encode WebP.** Tested in Playwright WebKit 26.6: `canvas.toBlob('image/webp')` returns a PNG. Chromium encodes WebP.
- **Browsers already apply EXIF rotation.** `image-orientation: from-image` is the default in Chromium and WebKit, and `createImageBitmap` follows it. No EXIF library is needed.
- **HEIC:** Safari decodes HEIC natively, and an iPhone file picker with `accept="image/*"` normally hands the page a JPEG anyway. Chrome, Firefox and Edge on desktop can't decode HEIC (e.g. files AirDropped from an iPhone).
- The `closet` bucket is private, accepts `image/webp` and `image/jpeg` up to 5 MB, and its policies only allow writes under `{user_id}/` (PR #8).

## Decision

**1. Process in the browser, with built-in APIs.**

- Decode with `createImageBitmap` (this applies the rotation).
- Draw onto a canvas twice:
  - **full:** longest edge ≤ 1600px
  - **thumbnail:** longest edge ≤ 600px, sharp in a 2-column phone grid on 3× screens
- Encode as **WebP (quality 0.82)**. If the browser returns anything else (Safari), encode as **JPEG (quality 0.85)** instead. The file extension follows the real type: `.webp` or `.jpg`.
- No general image library. `browser-image-compression` and `heic2any` were considered, but neither has been updated since 2023 and the browser now does their job.

**2. HEIC: only when needed, via `heic-to`.**

- If the file is HEIC/HEIF (by MIME type or extension) and the browser can't decode it, `import("heic-to/next")` dynamically and convert it to JPEG first. Then continue as in step 1.
- The ~3 MB converter (libheif compiled to WebAssembly) downloads only for those files, never on page load.
- `heic-to` is actively maintained: v1.6.5, libheif 1.23.5, updated 2026-10-01.
- Its licence is **LGPL-3.0**. That's acceptable here: a non-commercial app, the library is loaded unmodified as its own chunk, and the licence is listed in the PR that adds it.

**3. Upload from the browser straight to Storage; save the row with a Server Action.**

1. Generate the item id in the browser (`crypto.randomUUID()`), so the paths are known before upload.
2. Upload both files with the browser Supabase client (`src/lib/supabase/client.ts`) to `{user_id}/items/{id}.{webp|jpg}` and `{user_id}/items/{id}_thumb.{webp|jpg}`. Use `upsert: false` and the real `contentType`. The storage RLS policies enforce the folder.
3. Call a Server Action with the id, the form fields and the two paths. It validates them with Zod, including that both paths sit under the caller's folder, and inserts the row. The database also checks the folder.
4. If the insert fails, delete the two uploaded files so nothing is left orphaned.

**4. Where the code lives.** All of this goes in `src/lib/images/` (FRD §17):

- `prepareImage(file)` returns `{ full, thumb, ext }`.
- An upload helper returns the paths.

Feature code calls these and never touches canvas or Storage directly.

## Consequences

- No server-side image processing, and no native dependencies such as `sharp`.
- iPhones and Safari store **JPEG** instead of WebP, roughly 25–35% larger. At 1600px that's still well under the 5 MB bucket limit.
- The first HEIC upload on desktop Chrome or Firefox waits for a ~3 MB download, after which the browser caches it.
- Grid images use the thumbnail; detail pages use the full image. Both are shown through short-lived signed URLs (AGENTS.md).
- **Background removal later (AC-12):** a future step can produce a third file and fill `image_processed_path`, without changing this flow.
- **Testing:**
  - jsdom has no canvas, so unit tests cover the pure parts (target size maths, type detection, path building).
  - Playwright covers real decoding: an EXIF-rotated JPEG, a PNG and a HEIC fixture in Chromium, plus the JPEG fallback in WebKit.
  - Real iPhone camera and photo-library uploads get checked by hand on the preview.
- **To confirm while building feature 1:** that the iPhone file picker really hands over JPEG, and the exact `heic-to` bundle behaviour in a production build.
