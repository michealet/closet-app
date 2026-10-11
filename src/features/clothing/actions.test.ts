import { beforeEach, expect, it, vi } from "vitest";
import { addClothing } from "./actions";

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
])("rejects invalid or foreign data %j", async (change) => {
  expect(await addClothing({ ...input, ...change })).toMatchObject({
    status: "error",
  });
  expect(insert).not.toHaveBeenCalled();
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
