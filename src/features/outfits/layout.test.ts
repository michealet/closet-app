import { expect, it } from "vitest";
import type { ClothingCategory } from "@/lib/constants";
import {
  MIN_WIDTH,
  fitItem,
  moveLayer,
  placeItem,
  scaleItem,
  type CanvasItem,
} from "./layout";

const categories = new Map<string, ClothingCategory>();
const categoryOf = (id: string) => categories.get(id);
function add(items: CanvasItem[], id: string, category: ClothingCategory) {
  categories.set(id, category);
  return [...items, placeItem(id, category, 1, items, categoryOf)];
}

it("places pieces head to toe by category", () => {
  let items: CanvasItem[] = [];
  items = add(items, "top", "tops");
  items = add(items, "jeans", "bottoms");
  items = add(items, "boots", "shoes");
  const [top, jeans, boots] = items;
  expect(top.y).toBeLessThan(jeans.y);
  expect(jeans.y).toBeLessThan(boots.y);
  expect(top.x).toBe(0.5);
});

it("puts bags and jewelry at the sides", () => {
  const [bag, ring] = add(add([], "bag", "bags"), "ring", "jewelry");
  expect(bag.x).toBeGreaterThan(0.5);
  expect(ring.x).toBeLessThan(0.5);
});

it("nudges a second piece of the same category and stacks it on top", () => {
  const [first, second] = add(add([], "a", "tops"), "b", "tops");
  expect(second.x).toBeGreaterThan(first.x);
  expect(second.y).toBeGreaterThan(first.y);
  expect(second.z).toBeGreaterThan(first.z);
});

it("fits a tall or wide photo inside its category's box", () => {
  const top = (aspect: number) =>
    placeItem("t", "tops", aspect, [], () => undefined);
  expect(top(1).width).toBeCloseTo(0.4);
  expect(top(2).width).toBeCloseTo(0.2);
  expect(top(0.5).width).toBe(0.45);
});

it("keeps every position inside the canvas", () => {
  let items: CanvasItem[] = [];
  for (let i = 0; i < 30; i++) items = add(items, `shoe${i}`, "shoes");
  for (const item of items) {
    expect(item.x).toBeLessThanOrEqual(1);
    expect(item.y).toBeLessThanOrEqual(1);
  }
});

it("fits moved or resized pieces back into the canvas", () => {
  const item = { id: "a", x: -0.2, y: 1.4, width: 3, z: 0 };
  expect(fitItem(item)).toEqual({ id: "a", x: 0, y: 1, width: 1, z: 0 });
  expect(fitItem({ ...item, width: 0 }).width).toBe(MIN_WIDTH);
});

it("moves a piece up or down one layer", () => {
  const items = [
    { id: "a", x: 0.5, y: 0.5, width: 0.3, z: 0 },
    { id: "b", x: 0.5, y: 0.5, width: 0.3, z: 4 },
    { id: "c", x: 0.5, y: 0.5, width: 0.3, z: 7 },
  ];
  const z = (list: CanvasItem[]) => list.map((item) => `${item.id}${item.z}`);
  expect(z(moveLayer(items, "a", 1))).toEqual(["a1", "b0", "c2"]);
  expect(z(moveLayer(items, "c", -1))).toEqual(["a0", "b2", "c1"]);
  expect(moveLayer(items, "c", 1)).toBe(items);
  expect(moveLayer(items, "a", -1)).toBe(items);
});

it("scales a piece within the allowed sizes", () => {
  const item = { id: "a", x: 0.5, y: 0.5, width: 0.4, z: 0 };
  expect(scaleItem(item, 1.25).width).toBeCloseTo(0.5);
  expect(scaleItem(item, 10).width).toBe(1);
  expect(scaleItem(item, 0.01).width).toBe(MIN_WIDTH);
});
