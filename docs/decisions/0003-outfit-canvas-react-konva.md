# 0003. Outfit canvas uses react-konva

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

The outfit creator (FRD §8, build step 4) is the app's main feature. Its canvas must:

- **OC-4:** drag items by touch or mouse.
- **OC-5:** resize them keeping their proportions (corner handle; pinch or handle on phones).
- **OC-6:** change layer order and remove items.
- **OC-7:** store positions relative to the canvas (0–1), so outfits look the same on any screen (`outfit_items.x`, `y`, `width`, `z_index`).
- **OC-10:** turn the canvas into a thumbnail image on save.

FRD §17 asks for a proven drag/resize library and an ADR for the choice.

Options considered:

- **A. `react-rnd`:** items stay normal DOM images with drag/resize handles. Simple and accessible, but no pinch and no way to export the canvas, so we'd write our own thumbnail renderer.
- **B. `react-konva`:** items are drawn on an HTML canvas. Built-in drag (touch and mouse), a resize `Transformer` that can keep the ratio, layer order and `stage.toDataURL()` for the thumbnail.
- **C. Our own code on Pointer Events:** no dependency, but against FRD §17 and we'd own every touch quirk.

### Tested (throwaway branch, 2026-10-11)

| Check                     | Result                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                  | `konva` 10.7.1 + `react-konva` 19.3.0 install with React 19.3.0 / Next 16.3.8, no peer warnings; no runtime errors.                                  |
| Drag (OC-4)               | Mouse in desktop Chromium and WebKit; real touch events (CDP) on the Pixel 7 profile. The page doesn't scroll while dragging (`touch-action: none`). |
| Resize (OC-5)             | Corner anchor with `keepRatio`: scale 1.2 × 1.2.                                                                                                     |
| Relative positions (OC-7) | Read back as fractions, e.g. `x 0.333, y 0.35, width 0.6`.                                                                                           |
| Thumbnail (OC-10)         | `toDataURL` worked with a signed Storage URL loaded with `crossOrigin = "anonymous"` in all four browser setups.                                     |
| Storage CORS              | Local and **production** Storage return `Access-Control-Allow-Origin: *`, so the canvas isn't tainted.                                               |
| Download size             | Core import (`react-konva/lib/ReactKonvaCore` + the `Image` and `Transformer` shapes): **~84 KB gzip**. Full import: ~103 KB.                        |

Not covered by automation: touch on a real iPhone (Playwright can't send touch to WebKit) and pinch, which we write ourselves.

### Licences, dependencies and costs

| Package              | Licence | Notes                                                                                                              |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `konva` 10.7.1       | MIT     | No runtime dependencies. Optional peers `canvas` / `skia-canvas` are for Node rendering only and aren't installed. |
| `react-konva` 19.3.0 | MIT     | Pulls in `react-reconciler` 0.34, `scheduler` 0.28, `its-fine` 2 (all MIT) and `@types/react-reconciler`.          |

- Konva's FAQ: free for commercial and personal use, **no paid tiers or premium features**. Its maintainers sell a separate product (Polotno, a design-editor SDK) advertised in the react-konva readme; we don't need it.
- No new services, accounts, keys or plan changes. Vercel: the code loads only on the creator page. Supabase: one small thumbnail per outfit (tens of KB) in the existing `closet` bucket, well within the free plan.
- Both packages were updated in the last month (konva 2026-10-05, react-konva 2026-09-15).

## Decision

Use **`react-konva`** for the outfit canvas (option B).

- Import the core build only (`react-konva/lib/ReactKonvaCore` plus `konva/lib/shapes/Image` and `konva/lib/shapes/Transformer`), and load the canvas with `next/dynamic` and `ssr: false`, so it's never in other pages' bundles.
- Load item images with `crossOrigin = "anonymous"` from signed URLs (thumbnails while editing).
- Keep the stage's container at `touch-action: none`; size the stage to its container and convert to/from 0–1 coordinates at the edges (save, load, resize of the window).
- Resize with a `Transformer`: corner anchors, `keepRatio`, no rotation (not in the FRD).
- **Write ourselves:** two-finger pinch on the selected item, default positions by category (OC-8), and buttons for the selected item (forward, backward, remove, bigger, smaller) so the canvas can be used with a keyboard and screen readers (DS-8).
- **Thumbnail:** hide the Transformer, `toBlob` as WebP (JPEG fallback on Safari, as in ADR 0002), upload to `{user_id}/outfits/{outfit_id}.{webp|jpg}`.
- Code lives in `src/features/outfits/` (FRD §17).

## Consequences

- Drag, resize, layers and the thumbnail come from one maintained, MIT-licensed library; we write pinch, OC-8 placement and the accessibility buttons.
- The canvas isn't DOM, so items can't be focused directly; the buttons for the selected item are how keyboard and screen-reader users work with it.
- jsdom has no canvas, so unit tests cover the pure parts (coordinate conversion, default placement, layer order). Playwright covers drag and export in Chromium and WebKit; iPhone touch and pinch are checked by hand on the preview before merging the canvas PR.
- If Storage ever stopped sending CORS headers, thumbnails would fail to export; the save flow must report that (no silent failures) and still save the outfit.
