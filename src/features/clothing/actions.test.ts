import { beforeEach, expect, it, vi } from "vitest";
import {
  addClothing,
  deleteClothing,
  setItemFavorite,
  updateClothing,
} from "./actions";
import { clothingDetailsSchema } from "./schema";

const {
  insert,
  update,
  del,
  eq,
  select,
  removeFiles,
  getClaims,
  revalidatePath,
} = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  removeFiles: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  getClaims: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/images/storage", () => ({ removeClosetFiles: removeFiles }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
    from: () => ({ insert, update, delete: del }),
  }),
}));
const userId = "11111111-1111-4111-8111-111111111111";
const itemId = "22222222-2222-4222-8222-222222222222";
const input = {
  itemId,
  name: " Linen shirt ",
  category: "tops",
  imagePath: `${userId}/items/${itemId}.jpg`,
  thumbnailPath: `${userId}/items/${itemId}_thumb.jpg`,
};
beforeEach(() => {
  vi.clearAllMocks();
  getClaims.mockResolvedValue({ data: { claims: { sub: userId } } });
  insert.mockResolvedValue({ error: null });
  update.mockReturnValue({ eq });
  del.mockReturnValue({ eq });
  removeFiles.mockResolvedValue(true);
  eq.mockReturnValue({ select });
  select.mockResolvedValue({ data: [{ id: itemId }], error: null });
});
it("saves trimmed details and paths without accepting a user_id", async () => {
  expect(
    await addClothing({ ...input, user_id: "someone-else" }),
  ).toMatchObject({ status: "success" });
  expect(insert).toHaveBeenCalledWith({
    id: itemId,
    name: "Linen shirt",
    category: "tops",
    brand: null,
    notes: null,
    colors: [],
    seasons: [],
    tags: [],
    image_path: input.imagePath,
    thumbnail_path: input.thumbnailPath,
  });
  expect(revalidatePath).toHaveBeenCalledWith("/closet");
});
it.each([
  { name: "x".repeat(101) },
  { category: "invalid" },
  { itemId: "invalid" },
  { imagePath: input.imagePath.replace(userId, itemId) },
  { thumbnailPath: input.imagePath },
  { brand: "x".repeat(81) },
  { notes: "x".repeat(501) },
  { colors: ["unknown"] },
  { seasons: ["all_season"] },
])("rejects invalid or foreign data %j", async (change) => {
  expect(await addClothing({ ...input, ...change })).toMatchObject({
    status: "error",
  });
  expect(insert).not.toHaveBeenCalled();
});
it("saves optional details with trimmed text and unique selections", async () => {
  await addClothing({
    ...input,
    brand: " Uniqlo ",
    notes: " Soft linen ",
    colors: ["blue", "blue", "white"],
    seasons: ["spring", "summer"],
  });
  expect(insert.mock.calls[0][0]).toMatchObject({
    brand: "Uniqlo",
    notes: "Soft linen",
    colors: ["blue", "white"],
    seasons: ["spring", "summer"],
  });
});
it("accepts normalized empty optional details sent by the browser", async () => {
  const details = clothingDetailsSchema.parse({
    name: "Shirt",
    category: "tops",
    brand: "",
    notes: "",
  });
  expect(await addClothing({ ...input, ...details })).toMatchObject({
    status: "success",
  });
});
it("requires a valid session", async () => {
  getClaims.mockResolvedValue({ data: null });
  expect(await addClothing(input)).toMatchObject({ status: "error" });
  expect(insert).not.toHaveBeenCalled();
});
it("reports insert failure without invalidating the closet", async () => {
  insert.mockResolvedValue({ error: { message: "database failure" } });
  expect(await addClothing(input)).toMatchObject({ status: "error" });
  expect(revalidatePath).not.toHaveBeenCalled();
});

const details = {
  itemId,
  name: " Linen shirt ",
  category: "tops",
  colors: ["blue"],
};
it("updates details only when no new photo was uploaded", async () => {
  expect(await updateClothing(details)).toMatchObject({ status: "success" });
  expect(update).toHaveBeenCalledWith({
    name: "Linen shirt",
    category: "tops",
    brand: null,
    notes: null,
    colors: ["blue"],
    seasons: [],
    tags: [],
  });
  expect(eq).toHaveBeenCalledWith("id", itemId);
  expect(revalidatePath).toHaveBeenCalledWith("/closet");
});
it("saves a replaced photo's paths", async () => {
  await updateClothing({
    ...details,
    imagePath: input.imagePath,
    thumbnailPath: input.thumbnailPath,
  });
  expect(update.mock.calls[0][0]).toMatchObject({
    image_path: input.imagePath,
    thumbnail_path: input.thumbnailPath,
  });
});
it.each([
  { imagePath: input.imagePath },
  {
    imagePath: input.imagePath.replace(userId, itemId),
    thumbnailPath: input.thumbnailPath,
  },
  { imagePath: input.imagePath, thumbnailPath: input.imagePath },
])("rejects partial or foreign photo paths on edit %j", async (paths) => {
  expect(await updateClothing({ ...details, ...paths })).toMatchObject({
    status: "error",
  });
  expect(update).not.toHaveBeenCalled();
});
it("reports an item that isn't in the user's closet", async () => {
  select.mockResolvedValue({ data: [], error: null });
  expect(await updateClothing(details)).toMatchObject({
    status: "error",
    message: "This item is no longer in your closet.",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("saves a favorite and reports items it can't change", async () => {
  expect(await setItemFavorite({ id: itemId, isFavorite: true })).toMatchObject(
    { status: "success" },
  );
  expect(update).toHaveBeenCalledWith({ is_favorite: true });
  expect(eq).toHaveBeenCalledWith("id", itemId);

  select.mockResolvedValue({ data: [], error: null });
  expect(
    await setItemFavorite({ id: itemId, isFavorite: false }),
  ).toMatchObject({ status: "error" });
  expect(await setItemFavorite({ id: "x", isFavorite: true })).toMatchObject({
    status: "error",
  });
});
it("deletes an item and its photos", async () => {
  select.mockResolvedValue({
    data: [
      {
        image_path: input.imagePath,
        thumbnail_path: input.thumbnailPath,
        image_processed_path: null,
      },
    ],
    error: null,
  });
  expect(await deleteClothing(itemId)).toMatchObject({
    status: "success",
    message: "Item deleted.",
  });
  expect(eq).toHaveBeenCalledWith("id", itemId);
  expect(removeFiles.mock.calls[0][1]).toEqual([
    input.imagePath,
    input.thumbnailPath,
    null,
  ]);
  expect(revalidatePath).toHaveBeenCalledWith("/closet");
});
it("says so when a deleted item's photo couldn't be removed", async () => {
  select.mockResolvedValue({
    data: [
      {
        image_path: input.imagePath,
        thumbnail_path: null,
        image_processed_path: null,
      },
    ],
    error: null,
  });
  removeFiles.mockResolvedValue(false);
  expect(await deleteClothing(itemId)).toMatchObject({
    status: "success",
    message: "Item deleted, but its photo couldn't be removed.",
  });
});
it("doesn't touch storage when nothing was deleted", async () => {
  select.mockResolvedValue({ data: [], error: null });
  expect(await deleteClothing(itemId)).toMatchObject({ status: "error" });
  select.mockResolvedValue({ data: null, error: { message: "boom" } });
  expect(await deleteClothing(itemId)).toMatchObject({ status: "error" });
  expect(await deleteClothing("not-a-uuid")).toMatchObject({ status: "error" });
  expect(removeFiles).not.toHaveBeenCalled();
});

it("names an item from its details when Name is empty (#36)", async () => {
  await addClothing({ ...input, name: "", colors: ["navy"], brand: "Zara" });
  expect(insert.mock.calls[0][0]).toMatchObject({ name: "Navy Zara top" });
});
it("saves tags lowercase, trimmed and once each", async () => {
  await addClothing({ ...input, tags: [" Linen ", "linen", "Wedding  Guest"] });
  expect(insert.mock.calls[0][0]).toMatchObject({
    tags: ["linen", "wedding guest"],
  });
  expect(await addClothing({ ...input, tags: ["x".repeat(31)] })).toMatchObject(
    { status: "error" },
  );
  expect(
    await addClothing({
      ...input,
      tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
    }),
  ).toMatchObject({ status: "error", message: "Use at most 20 tags." });
});
