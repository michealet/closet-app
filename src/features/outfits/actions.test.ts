import { beforeEach, expect, it, vi } from "vitest";
import {
  deleteOutfit,
  planOutfit,
  saveOutfit,
  setOutfitFavorite,
} from "./actions";

const {
  from,
  insertOutfit,
  insertItems,
  update,
  select,
  del,
  eq,
  getClaims,
  revalidatePath,
  deleted,
  insertPlan,
  removeFiles,
} = vi.hoisted(() => ({
  deleted: vi.fn(),
  insertPlan: vi.fn(),
  removeFiles: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  insertOutfit: vi.fn(),
  insertItems: vi.fn(),
  del: vi.fn(),
  eq: vi.fn(),
  getClaims: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/images/storage", () => ({ removeClosetFiles: removeFiles }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims }, from }),
}));
const userId = "11111111-1111-4111-8111-111111111111";
const outfitId = "33333333-3333-4333-8333-333333333333";
const shirt = "22222222-2222-4222-8222-222222222222";
const jeans = "44444444-4444-4444-8444-444444444444";
const input = {
  outfitId,
  name: " Friday dinner ",
  occasion: "dinner",
  seasons: ["fall", "fall"],
  notes: "",
  isFavorite: true,
  thumbnailPath: `${userId}/outfits/${outfitId}.webp`,
  items: [
    { id: shirt, x: 0.5, y: 0.27, width: 0.4, z: 0 },
    { id: jeans, x: 0.5, y: 0.62, width: 0.24, z: 1 },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  getClaims.mockResolvedValue({ data: { claims: { sub: userId } } });
  from.mockImplementation((table: string) =>
    table === "outfits"
      ? { insert: insertOutfit, delete: del, update }
      : table === "planned_outfits"
        ? { insert: insertPlan }
        : { insert: insertItems },
  );
  insertOutfit.mockResolvedValue({ error: null });
  insertItems.mockResolvedValue({ error: null });
  del.mockReturnValue({ eq });
  // Awaited directly (saveOutfit's clean-up) or followed by .select (delete).
  eq.mockReturnValue({
    select: deleted,
    then: (done: (value: unknown) => void) => done({ error: null }),
  });
  deleted.mockResolvedValue({
    data: [{ thumbnail_path: input.thumbnailPath }],
    error: null,
  });
  insertPlan.mockResolvedValue({ error: null });
  removeFiles.mockResolvedValue(true);
  update.mockReturnValue({ eq: () => ({ select }) });
  select.mockResolvedValue({ data: [{ id: outfitId }], error: null });
});

it("saves the outfit, its thumbnail and where each piece sits", async () => {
  expect(await saveOutfit({ ...input, user_id: "someone-else" })).toEqual({
    status: "success",
    message: "Outfit saved.",
  });
  expect(insertOutfit).toHaveBeenCalledWith({
    id: outfitId,
    name: "Friday dinner",
    occasion: "dinner",
    seasons: ["fall"],
    notes: null,
    is_favorite: true,
    thumbnail_path: input.thumbnailPath,
  });
  expect(insertItems).toHaveBeenCalledWith([
    {
      outfit_id: outfitId,
      clothing_item_id: shirt,
      x: 0.5,
      y: 0.27,
      width: 0.4,
      z_index: 0,
    },
    {
      outfit_id: outfitId,
      clothing_item_id: jeans,
      x: 0.5,
      y: 0.62,
      width: 0.24,
      z_index: 1,
    },
  ]);
  expect(revalidatePath).toHaveBeenCalledWith("/outfits");
});

it("saves without a thumbnail when none could be made", async () => {
  await saveOutfit({ ...input, thumbnailPath: null });
  expect(insertOutfit).toHaveBeenCalledWith(
    expect.objectContaining({ thumbnail_path: null }),
  );
});

it.each([
  [{ name: "  " }, "Give your outfit a name."],
  [{ items: [] }, "Add at least one piece to your outfit."],
  [{ items: [input.items[0], input.items[0]] }, "Each piece can be on"],
  [{ items: [{ ...input.items[0], x: 1.2 }] }, ""],
  [{ thumbnailPath: `${userId}/items/${outfitId}.webp` }, "Couldn't save"],
  [{ thumbnailPath: `${jeans}/outfits/${outfitId}.webp` }, "Couldn't save"],
])("refuses %o", async (change, message) => {
  const result = await saveOutfit({ ...input, ...change });
  expect(result.status).toBe("error");
  expect(result).toHaveProperty("message", expect.stringContaining(message));
  expect(insertOutfit).not.toHaveBeenCalled();
});

it("asks signed-out users to sign in again", async () => {
  getClaims.mockResolvedValue({ data: null, error: new Error("expired") });
  expect(await saveOutfit(input)).toMatchObject({ status: "error" });
  expect(insertOutfit).not.toHaveBeenCalled();
});

it("removes the outfit again when its pieces can't be saved", async () => {
  insertItems.mockResolvedValue({ error: { code: "23503" } });
  expect(await saveOutfit(input)).toEqual({
    status: "error",
    message:
      "A piece was removed from your closet. Take it off and save again.",
  });
  expect(eq).toHaveBeenCalledWith("id", outfitId);
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("hearts an outfit, and says when it can't", async () => {
  expect(await setOutfitFavorite({ id: outfitId, isFavorite: true })).toEqual({
    status: "success",
    message: "Added to favorites.",
  });
  expect(update).toHaveBeenCalledWith({ is_favorite: true });
  expect(revalidatePath).toHaveBeenCalledWith("/outfits");

  select.mockResolvedValue({ data: [], error: null });
  expect(
    await setOutfitFavorite({ id: outfitId, isFavorite: false }),
  ).toMatchObject({ status: "error" });
  expect(await setOutfitFavorite({ id: "nope" })).toMatchObject({
    status: "error",
  });
});

it("deletes an outfit and its picture", async () => {
  expect(await deleteOutfit(outfitId)).toEqual({
    status: "success",
    message: "Outfit deleted.",
  });
  expect(eq).toHaveBeenCalledWith("id", outfitId);
  expect(removeFiles).toHaveBeenCalledWith(expect.anything(), [
    input.thumbnailPath,
  ]);
  expect(revalidatePath).toHaveBeenCalledWith("/outfits");
});

it("says when an outfit to delete is gone or its picture stays", async () => {
  removeFiles.mockResolvedValue(false);
  expect(await deleteOutfit(outfitId)).toMatchObject({
    message: "Outfit deleted, but its picture couldn't be removed.",
  });
  deleted.mockResolvedValue({ data: [], error: null });
  expect(await deleteOutfit(outfitId)).toEqual({
    status: "error",
    message: "This outfit no longer exists.",
  });
  expect(await deleteOutfit("nope")).toMatchObject({ status: "error" });
});

it("plans an outfit for a date, with an optional event", async () => {
  expect(
    await planOutfit({ outfitId, date: "2026-10-24", eventName: "  " }),
  ).toEqual({ status: "success", message: "Outfit planned." });
  expect(insertPlan).toHaveBeenCalledWith({
    outfit_id: outfitId,
    date: "2026-10-24",
    event_name: null,
  });
  expect(revalidatePath).toHaveBeenCalledWith(`/outfits/${outfitId}`);
});

it.each(["", "24/10/2026", "2026-13-01", "2026-02-30"])(
  "refuses the date %j",
  async (date) => {
    expect(await planOutfit({ outfitId, date })).toMatchObject({
      status: "error",
    });
    expect(insertPlan).not.toHaveBeenCalled();
  },
);
