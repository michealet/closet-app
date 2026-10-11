import { beforeEach, expect, it, vi } from "vitest";
import { addClothing } from "./actions";
import { clothingDetailsSchema } from "./schema";

const { insert, getClaims, revalidatePath } = vi.hoisted(() => ({
  insert: vi.fn(),
  getClaims: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
    from: () => ({ insert }),
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
    image_path: input.imagePath,
    thumbnail_path: input.thumbnailPath,
  });
  expect(revalidatePath).toHaveBeenCalledWith("/closet");
});
it.each([
  { name: " " },
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
