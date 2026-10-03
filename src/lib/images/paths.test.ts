import { describe, expect, it } from "vitest";
import {
  isItemImagePath,
  isOutfitImagePath,
  itemImagePaths,
  outfitThumbnailPath,
} from "./paths";

const user = "00000000-0000-0000-0000-00000000000a";
const other = "00000000-0000-0000-0000-00000000000b";
const item = "11111111-2222-3333-4444-555555555555";

describe("itemImagePaths", () => {
  it("puts both files in the owner's items folder", () => {
    expect(itemImagePaths(user, item, "webp")).toEqual({
      imagePath: `${user}/items/${item}.webp`,
      thumbnailPath: `${user}/items/${item}_thumb.webp`,
    });
    expect(itemImagePaths(user, item, "jpg").imagePath).toBe(
      `${user}/items/${item}.jpg`,
    );
  });
});

describe("isItemImagePath", () => {
  const { imagePath, thumbnailPath } = itemImagePaths(user, item, "jpg");

  it("accepts the owner's own full image and thumbnail", () => {
    expect(isItemImagePath(imagePath, { userId: user, itemId: item })).toBe(
      true,
    );
    expect(
      isItemImagePath(thumbnailPath, {
        userId: user,
        itemId: item,
        thumb: true,
      }),
    ).toBe(true);
  });

  it("rejects a thumbnail where the full image is expected, and vice versa", () => {
    expect(isItemImagePath(thumbnailPath, { userId: user, itemId: item })).toBe(
      false,
    );
    expect(
      isItemImagePath(imagePath, { userId: user, itemId: item, thumb: true }),
    ).toBe(false);
  });

  it.each([
    ["another user's folder", `${other}/items/${item}.jpg`],
    ["another item", `${user}/items/${other}.jpg`],
    ["an unsupported extension", `${user}/items/${item}.png`],
    ["path traversal", `${user}/items/../${other}/items/${item}.jpg`],
    ["the outfits folder", `${user}/outfits/${item}.jpg`],
    ["a leading slash", `/${user}/items/${item}.jpg`],
  ])("rejects %s", (_label, path) => {
    expect(isItemImagePath(path, { userId: user, itemId: item })).toBe(false);
  });
});

describe("outfit paths", () => {
  it("builds and checks an outfit thumbnail path", () => {
    const path = outfitThumbnailPath(user, item, "webp");
    expect(path).toBe(`${user}/outfits/${item}.webp`);
    expect(isOutfitImagePath(path, { userId: user, outfitId: item })).toBe(
      true,
    );
    expect(isOutfitImagePath(path, { userId: other, outfitId: item })).toBe(
      false,
    );
  });
});
