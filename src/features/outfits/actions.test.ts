import { beforeEach, expect, it, vi } from "vitest";
import { saveOutfit, setOutfitFavorite } from "./actions";

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
} = vi.hoisted(() => ({
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
      : { insert: insertItems },
  );
  insertOutfit.mockResolvedValue({ error: null });
  insertItems.mockResolvedValue({ error: null });
  del.mockReturnValue({ eq });
  eq.mockResolvedValue({ error: null });
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
