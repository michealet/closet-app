import { describe, expect, it } from "vitest";
import {
  FULL_MAX_EDGE,
  THUMB_MAX_EDGE,
  fitWithin,
  looksLikeHeic,
} from "./prepare";

// prepareImage itself needs a real canvas; it's tested in e2e/images.spec.ts.

describe("fitWithin", () => {
  it("shrinks the longest edge to the limit, keeping the proportions", () => {
    expect(fitWithin(4032, 3024, FULL_MAX_EDGE)).toEqual({
      width: 1600,
      height: 1200,
    });
    expect(fitWithin(3024, 4032, THUMB_MAX_EDGE)).toEqual({
      width: 450,
      height: 600,
    });
  });

  it("never upscales small images", () => {
    expect(fitWithin(320, 200, FULL_MAX_EDGE)).toEqual({
      width: 320,
      height: 200,
    });
  });

  it("keeps at least one pixel on extreme shapes", () => {
    expect(fitWithin(10000, 2, THUMB_MAX_EDGE)).toEqual({
      width: 600,
      height: 1,
    });
  });
});

describe("looksLikeHeic", () => {
  it.each([
    { name: "IMG_0001.HEIC", type: "" },
    { name: "photo.heif", type: "" },
    { name: "photo", type: "image/heic" },
    { name: "photo", type: "image/heif-sequence" },
  ])("recognises %o", (file) => {
    expect(looksLikeHeic(file)).toBe(true);
  });

  it.each([
    { name: "photo.jpg", type: "image/jpeg" },
    { name: "heic-notes.txt", type: "text/plain" },
  ])("ignores %o", (file) => {
    expect(looksLikeHeic(file)).toBe(false);
  });
});
