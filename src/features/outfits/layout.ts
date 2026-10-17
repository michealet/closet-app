import type { ClothingCategory } from "@/lib/constants";

/** Canvas width ÷ height. Fixed, so 0–1 positions look the same everywhere (OC-7). */
export const CANVAS_RATIO = 3 / 4;
/** Smallest width an item can be resized to, as a share of the canvas. */
export const MIN_WIDTH = 0.08;

/**
 * An item on the canvas, as stored in `outfit_items`: the centre (`x`, `y`)
 * and `width` are shares of the canvas (0–1); the height follows the photo.
 */
export type CanvasItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  z: number;
};

/** A box for a category: centre, and the most width and height it may take (0–1). */
type Spot = { x: number; y: number; width: number; height: number };

/** Where a new piece goes, by category (OC-8): a rough outfit, head to toe. */
const SPOTS: Record<ClothingCategory, Spot> = {
  accessories: { x: 0.2, y: 0.12, width: 0.22, height: 0.16 },
  tops: { x: 0.5, y: 0.27, width: 0.45, height: 0.3 },
  jackets_outerwear: { x: 0.5, y: 0.3, width: 0.5, height: 0.36 },
  dresses: { x: 0.5, y: 0.42, width: 0.45, height: 0.6 },
  sets: { x: 0.5, y: 0.42, width: 0.5, height: 0.6 },
  jewelry: { x: 0.2, y: 0.4, width: 0.18, height: 0.14 },
  bags: { x: 0.8, y: 0.55, width: 0.28, height: 0.25 },
  bottoms: { x: 0.5, y: 0.62, width: 0.4, height: 0.36 },
  shoes: { x: 0.5, y: 0.89, width: 0.3, height: 0.16 },
};
/** How far each extra piece of the same category is nudged, so none hide. */
const NUDGE = 0.05;

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/**
 * Places a new piece in its category's box, as large as fits, on top of
 * everything (OC-8). `aspect` is the photo's height ÷ width.
 */
export function placeItem(
  id: string,
  category: ClothingCategory,
  aspect: number,
  items: CanvasItem[],
  categoryOf: (id: string) => ClothingCategory | undefined,
): CanvasItem {
  const spot = SPOTS[category];
  const same = items.filter((item) => categoryOf(item.id) === category).length;
  const z = items.reduce((top, item) => Math.max(top, item.z + 1), 0);
  // Height share = width × aspect × CANVAS_RATIO; keep it within the box.
  const width = Math.min(spot.width, spot.height / (aspect * CANVAS_RATIO));
  return fitItem({
    id,
    x: spot.x + same * NUDGE,
    y: spot.y + same * NUDGE,
    width,
    z,
  });
}

/** Keeps a moved or resized piece valid for `outfit_items` (centre on the canvas, 0 < width ≤ 1). */
export function fitItem(item: CanvasItem): CanvasItem {
  return {
    ...item,
    x: clamp(item.x),
    y: clamp(item.y),
    width: clamp(item.width, MIN_WIDTH, 1),
  };
}

/**
 * Moves a piece one layer up (+1) or down (-1) (OC-6). Layers come back
 * numbered 0, 1, 2… in drawing order.
 */
export function moveLayer(
  items: CanvasItem[],
  id: string,
  step: 1 | -1,
): CanvasItem[] {
  const order = [...items].sort((a, b) => a.z - b.z);
  const from = order.findIndex((item) => item.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= order.length) return items;
  [order[from], order[to]] = [order[to], order[from]];
  const z = new Map(order.map((item, index) => [item.id, index]));
  return items.map((item) => ({ ...item, z: z.get(item.id)! }));
}

/** Makes a piece bigger or smaller by `factor`, keeping it valid (OC-5, OC-6). */
export function scaleItem(item: CanvasItem, factor: number): CanvasItem {
  return fitItem({ ...item, width: item.width * factor });
}
