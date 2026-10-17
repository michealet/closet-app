import { beforeEach, expect, it, vi } from "vitest";
import { duplicateOutfit, updateOutfit } from "./actions";

const userId = "11111111-1111-4111-8111-111111111111";
const outfitId = "33333333-3333-4333-8333-333333333333";
const shirt = "22222222-2222-4222-8222-222222222222";
const jeans = "44444444-4444-4444-8444-444444444444";

const db = vi.hoisted(() => ({
  updated: vi.fn(),
  upsert: vi.fn(),
  removed: vi.fn(),
  notIn: vi.fn(),
  source: vi.fn(),
  insertOutfit: vi.fn(),
  insertItems: vi.fn(),
  deleteOutfit: vi.fn(),
  copy: vi.fn(),
  removeFiles: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: db.revalidatePath }));
vi.mock("@/lib/images/storage", () => ({ removeClosetFiles: db.removeFiles }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: { claims: { sub: userId } } }),
    },
    storage: { from: () => ({ copy: db.copy }) },
    from: (table: string) =>
      table === "outfits"
        ? {
            update: (values: unknown) => ({
              eq: () => ({ select: () => db.updated(values) }),
            }),
            select: () => ({ eq: () => ({ maybeSingle: db.source }) }),
            insert: db.insertOutfit,
            delete: () => ({ eq: db.deleteOutfit }),
          }
        : {
            upsert: db.upsert,
            insert: db.insertItems,
            delete: () => ({
              eq: (_: string, id: string) => ({
                not: (...args: unknown[]) => db.notIn(id, ...args),
              }),
            }),
          },
  }),
}));

const edit = {
  outfitId,
  name: "Friday dinner",
  occasion: "dinner",
  seasons: ["fall"],
  notes: null,
  isFavorite: false,
  thumbnailPath: `${userId}/outfits/${outfitId}.jpg`,
  items: [{ id: jeans, x: 0.4, y: 0.6, width: 0.3, z: 0 }],
};
beforeEach(() => {
  vi.clearAllMocks();
  db.updated.mockResolvedValue({ data: [{ id: outfitId }], error: null });
  db.upsert.mockResolvedValue({ error: null });
  db.notIn.mockResolvedValue({ error: null });
  db.source.mockResolvedValue({
    data: {
      name: "Friday dinner",
      occasion: "dinner",
      seasons: ["fall"],
      notes: "Warm",
      thumbnail_path: `${userId}/outfits/${outfitId}.webp`,
      outfit_items: [
        { clothing_item_id: shirt, x: 0.5, y: 0.3, width: 0.4, z_index: 1 },
      ],
    },
  });
  db.insertOutfit.mockResolvedValue({ error: null });
  db.insertItems.mockResolvedValue({ error: null });
  db.deleteOutfit.mockResolvedValue({ error: null });
  db.copy.mockResolvedValue({ error: null });
  db.removeFiles.mockResolvedValue(true);
});

it("saves edited details, places pieces, then removes the ones taken off", async () => {
  expect(await updateOutfit(edit)).toEqual({
    status: "success",
    message: "Changes saved.",
  });
  expect(db.updated).toHaveBeenCalledWith({
    name: "Friday dinner",
    occasion: "dinner",
    seasons: ["fall"],
    notes: null,
    is_favorite: false,
    thumbnail_path: edit.thumbnailPath,
  });
  expect(db.upsert).toHaveBeenCalledWith([
    {
      outfit_id: outfitId,
      clothing_item_id: jeans,
      x: 0.4,
      y: 0.6,
      width: 0.3,
      z_index: 0,
    },
  ]);
  expect(db.notIn).toHaveBeenCalledWith(
    outfitId,
    "clothing_item_id",
    "in",
    `(${jeans})`,
  );
  expect(db.upsert.mock.invocationCallOrder[0]).toBeLessThan(
    db.notIn.mock.invocationCallOrder[0],
  );
});

it("keeps every piece when placing them fails", async () => {
  db.upsert.mockResolvedValue({ error: { code: "XX000" } });
  expect(await updateOutfit(edit)).toMatchObject({ status: "error" });
  expect(db.notIn).not.toHaveBeenCalled();
});

it("refuses an edit of an outfit that isn't there or someone else's picture", async () => {
  db.updated.mockResolvedValue({ data: [], error: null });
  expect(await updateOutfit(edit)).toEqual({
    status: "error",
    message: "This outfit no longer exists.",
  });
  expect(
    await updateOutfit({
      ...edit,
      thumbnailPath: `${shirt}/outfits/${outfitId}.jpg`,
    }),
  ).toMatchObject({ status: "error" });
  expect(db.upsert).not.toHaveBeenCalled();
});

it("duplicates an outfit with its pieces and picture", async () => {
  const result = await duplicateOutfit(outfitId);
  expect(result).toMatchObject({
    status: "success",
    message: "Outfit duplicated.",
  });
  const copyId = result.outfitId!;
  expect(copyId).toMatch(/^[0-9a-f-]{36}$/);
  expect(copyId).not.toBe(outfitId);
  const picture = `${userId}/outfits/${copyId}.webp`;
  expect(db.copy).toHaveBeenCalledWith(
    `${userId}/outfits/${outfitId}.webp`,
    picture,
  );
  expect(db.insertOutfit).toHaveBeenCalledWith({
    id: copyId,
    name: "Copy of Friday dinner",
    occasion: "dinner",
    seasons: ["fall"],
    notes: "Warm",
    thumbnail_path: picture,
  });
  expect(db.insertItems).toHaveBeenCalledWith([
    {
      clothing_item_id: shirt,
      x: 0.5,
      y: 0.3,
      width: 0.4,
      z_index: 1,
      outfit_id: copyId,
    },
  ]);
});

it("duplicates without a picture when it can't be copied", async () => {
  db.copy.mockResolvedValue({ error: new Error("missing") });
  await duplicateOutfit(outfitId);
  expect(db.insertOutfit).toHaveBeenCalledWith(
    expect.objectContaining({ thumbnail_path: null }),
  );
});

it("cleans up a copy whose pieces can't be saved", async () => {
  db.insertItems.mockResolvedValue({ error: { code: "XX000" } });
  const result = await duplicateOutfit(outfitId);
  expect(result.status).toBe("error");
  expect(db.deleteOutfit).toHaveBeenCalled();
  expect(db.removeFiles).toHaveBeenCalledWith(expect.anything(), [
    expect.stringMatching(/\/outfits\/.+\.webp$/),
  ]);
});

it("refuses to duplicate a missing outfit", async () => {
  db.source.mockResolvedValue({ data: null });
  expect(await duplicateOutfit(outfitId)).toMatchObject({ status: "error" });
  expect(await duplicateOutfit("nope")).toMatchObject({ status: "error" });
  expect(db.insertOutfit).not.toHaveBeenCalled();
});
