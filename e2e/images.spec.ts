import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";

/**
 * Runs src/lib/images/prepare.ts in real browsers (jsdom has no canvas):
 * Chromium encodes WebP; WebKit (Safari) can't, so it must fall back to JPEG.
 */

let bundle: string;

test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["src/lib/images/prepare.ts"],
    bundle: true,
    format: "iife",
    globalName: "Images",
    platform: "browser",
    write: false,
    logLevel: "silent",
  });
  bundle = result.outputFiles[0].text;
});

type Probe = {
  width: number;
  height: number;
  fullType: string;
  thumbType: string;
  ext: string;
  fullSize: [number, number];
  thumbSize: [number, number];
  /** RGBA of the full image at a few points, as [x%, y%] → [r, g, b, a]. */
  pixels: Record<string, number[]>;
};

/** Loads the bundle and runs prepareImage on a file built in the page. */
async function prepare(
  page: Page,
  file: {
    bytes?: number[];
    draw?: string;
    width?: number;
    height?: number;
    name: string;
    type: string;
  },
  points: [number, number][] = [],
): Promise<Probe> {
  await page.setContent("<!doctype html><title>images</title>");
  await page.addScriptTag({ content: bundle });
  return page.evaluate(
    async ({ file, points }) => {
      let blob: Blob;
      if (file.bytes) {
        blob = new Blob([new Uint8Array(file.bytes)], { type: file.type });
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = file.width!;
        canvas.height = file.height!;
        new Function("ctx", "w", "h", file.draw!)(
          canvas.getContext("2d"),
          file.width,
          file.height,
        );
        blob = await new Promise<Blob>((r) =>
          canvas.toBlob((b) => r(b!), file.type),
        );
      }
      // @ts-expect-error -- global from the esbuild bundle
      const { prepareImage } = window.Images;
      const result = await prepareImage(
        new File([blob], file.name, { type: blob.type }),
      );

      const read = async (b: Blob) => createImageBitmap(b);
      const full = await read(result.full);
      const thumb = await read(result.thumb);
      const canvas = document.createElement("canvas");
      canvas.width = full.width;
      canvas.height = full.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(full, 0, 0);
      const pixels: Record<string, number[]> = {};
      for (const [px, py] of points) {
        const x = Math.min(full.width - 1, Math.floor((px / 100) * full.width));
        const y = Math.min(
          full.height - 1,
          Math.floor((py / 100) * full.height),
        );
        pixels[`${px},${py}`] = Array.from(ctx.getImageData(x, y, 1, 1).data);
      }
      return {
        width: result.width,
        height: result.height,
        fullType: result.full.type,
        thumbType: result.thumb.type,
        ext: result.ext,
        fullSize: [full.width, full.height],
        thumbSize: [thumb.width, thumb.height],
        pixels,
      };
    },
    { file, points },
  );
}

const isRed = ([r, g, b]: number[]) => r > 150 && g < 120 && b < 120;
const isBlue = ([r, , b]: number[]) => b > 150 && r < 120;

test("shrinks a large photo to 1600px and a 600px thumbnail", async ({
  page,
  browserName,
}) => {
  const out = await prepare(page, {
    name: "big.png",
    type: "image/png",
    width: 4032,
    height: 3024,
    draw: "ctx.fillStyle='#d24';ctx.fillRect(0,0,w,h)",
  });

  expect(out.fullSize).toEqual([1600, 1200]);
  expect(out.thumbSize).toEqual([600, 450]);
  expect([out.width, out.height]).toEqual([1600, 1200]);
  if (browserName === "webkit") {
    expect([out.ext, out.fullType, out.thumbType]).toEqual([
      "jpg",
      "image/jpeg",
      "image/jpeg",
    ]);
  } else {
    expect([out.ext, out.fullType, out.thumbType]).toEqual([
      "webp",
      "image/webp",
      "image/webp",
    ]);
  }
});

test("never enlarges a small photo", async ({ page }) => {
  const out = await prepare(page, {
    name: "small.png",
    type: "image/png",
    width: 320,
    height: 200,
    draw: "ctx.fillStyle='#246';ctx.fillRect(0,0,w,h)",
  });

  expect(out.fullSize).toEqual([320, 200]);
  expect(out.thumbSize).toEqual([320, 200]);
});

test("gives transparent areas a white background when saving JPEG", async ({
  page,
  browserName,
}) => {
  const out = await prepare(
    page,
    {
      name: "cutout.png",
      type: "image/png",
      width: 400,
      height: 400,
      draw: "ctx.fillStyle='#d24';ctx.fillRect(100,100,200,200)",
    },
    [[5, 5]],
  );

  const corner = out.pixels["5,5"];
  if (browserName === "webkit") {
    expect(corner.slice(0, 3).every((v) => v > 245)).toBe(true); // white, not black
  } else {
    expect(corner[3]).toBe(0); // WebP keeps transparency
  }
});

test("applies the phone's rotation (EXIF orientation)", async ({ page }) => {
  // A 400×200 JPEG, red on the left and blue on the right, tagged
  // "rotate 90° clockwise" (orientation 6), the way phones save photos.
  await page.setContent("<!doctype html>");
  const jpeg = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 200;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e33";
    g.fillRect(0, 0, 200, 200);
    g.fillStyle = "#33e";
    g.fillRect(200, 0, 200, 200);
    const b = await new Promise<Blob>((r) =>
      c.toBlob((x) => r(x!), "image/jpeg", 0.95),
    );
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  const exif = [
    0xff,
    0xe1,
    0x00,
    0x22, // APP1, length 34
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00, // "Exif\0\0"
    0x4d,
    0x4d,
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08, // big-endian TIFF header
    0x00,
    0x01, // one IFD entry
    0x01,
    0x12,
    0x00,
    0x03,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x06,
    0x00,
    0x00, // Orientation = 6
    0x00,
    0x00,
    0x00,
    0x00, // no next IFD
  ];
  const rotated = [...jpeg.slice(0, 2), ...exif, ...jpeg.slice(2)];

  const out = await prepare(
    page,
    { bytes: rotated, name: "IMG_0001.JPG", type: "image/jpeg" },
    [
      [50, 15],
      [50, 85],
    ],
  );

  expect(out.fullSize).toEqual([200, 400]); // now portrait
  expect(isRed(out.pixels["50,15"])).toBe(true); // the left (red) half is now on top
  expect(isBlue(out.pixels["50,85"])).toBe(true);
});

test("converts HEIC photos", async ({ page }) => {
  test.setTimeout(60_000); // the HEIC converter is ~3 MB
  const heic = Array.from(
    readFileSync("e2e/fixtures/red-left-blue-right.heic"),
  );

  const out = await prepare(
    page,
    { bytes: heic, name: "IMG_0002.HEIC", type: "image/heic" },
    [
      [15, 50],
      [85, 50],
    ],
  );

  expect(out.fullSize).toEqual([320, 200]);
  expect(isRed(out.pixels["15,50"])).toBe(true);
  expect(isBlue(out.pixels["85,50"])).toBe(true);
});

test("explains files that aren't photos", async ({ page }) => {
  await page.setContent("<!doctype html>");
  await page.addScriptTag({ content: bundle });
  const message = await page.evaluate(async () => {
    // @ts-expect-error -- global from the esbuild bundle
    const { prepareImage } = window.Images;
    try {
      await prepareImage(
        new File(["not a photo"], "notes.txt", { type: "text/plain" }),
      );
      return "no error";
    } catch (error) {
      return `${(error as Error).name}: ${(error as Error).message}`;
    }
  });

  expect(message).toBe(
    "ImageError: That file isn't a photo we can open. Try a JPEG, PNG, WebP or HEIC.",
  );
});
