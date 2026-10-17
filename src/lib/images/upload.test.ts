import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageError } from "./prepare";

const userId = "00000000-0000-0000-0000-00000000000a";
const upload = vi.fn();
const remove = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: userId } } }) },
    storage: { from: () => ({ upload, remove }) },
  }),
}));

vi.mock("./prepare", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./prepare")>()),
  // jsdom has no canvas encoder.
  canEncodeWebp: vi.fn(async () => true),
  prepareImage: vi.fn(async () => ({
    full: new Blob(["full"], { type: "image/jpeg" }),
    thumb: new Blob(["thumb"], { type: "image/jpeg" }),
    ext: "jpg",
    contentType: "image/jpeg",
    width: 1600,
    height: 1200,
  })),
}));

const { uploadItemPhoto, uploadOutfitThumbnail } = await import("./upload");
const photo = new File(["x"], "photo.jpg", { type: "image/jpeg" });

beforeEach(() => {
  upload.mockReset().mockResolvedValue({ data: {}, error: null });
  remove.mockReset().mockResolvedValue({ data: [], error: null });
});

describe("uploadItemPhoto", () => {
  it("uploads the full image and thumbnail under a new item id", async () => {
    const result = await uploadItemPhoto(photo);

    expect(result.itemId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.imagePath).toBe(`${userId}/items/${result.itemId}.jpg`);
    expect(result.thumbnailPath).toBe(
      `${userId}/items/${result.itemId}_thumb.jpg`,
    );
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls[0][0]).toBe(result.imagePath);
    expect(upload.mock.calls[1][0]).toBe(result.thumbnailPath);
    expect(upload.mock.calls[0][2]).toMatchObject({
      contentType: "image/jpeg",
      upsert: false,
    });
  });

  it("reuses an existing item's paths when replacing its photo", async () => {
    const itemId = "11111111-2222-3333-4444-555555555555";
    const result = await uploadItemPhoto(photo, itemId);

    expect(result.itemId).toBe(itemId);
    expect(upload.mock.calls[0][2]).toMatchObject({ upsert: true });
  });

  it("removes the full image if the thumbnail upload fails", async () => {
    upload
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("network") });

    await expect(uploadItemPhoto(photo)).rejects.toBeInstanceOf(ImageError);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });

  it("uploads nothing else if the full image fails", async () => {
    upload.mockResolvedValueOnce({ data: null, error: new Error("network") });

    await expect(uploadItemPhoto(photo)).rejects.toThrow(/Couldn't upload/);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("uploadOutfitThumbnail", () => {
  const outfitId = "00000000-0000-4000-8000-0000000000f1";
  const canvas = (blob: Blob | null) =>
    ({
      toBlob: (done: (value: Blob | null) => void) => done(blob),
    }) as unknown as HTMLCanvasElement;

  it("uploads the canvas picture into the user's outfits folder", async () => {
    const path = await uploadOutfitThumbnail(
      canvas(new Blob(["png"])),
      outfitId,
    );

    expect(path).toBe(`${userId}/outfits/${outfitId}.webp`);
    expect(upload).toHaveBeenCalledWith(
      path,
      expect.any(Blob),
      expect.objectContaining({ upsert: true }),
    );
  });

  it("reports a canvas that couldn't be encoded or uploaded", async () => {
    await expect(uploadOutfitThumbnail(canvas(null), outfitId)).rejects.toThrow(
      ImageError,
    );
    upload.mockResolvedValueOnce({ data: null, error: new Error("down") });
    await expect(
      uploadOutfitThumbnail(canvas(new Blob(["png"])), outfitId),
    ).rejects.toThrow(ImageError);
  });
});
