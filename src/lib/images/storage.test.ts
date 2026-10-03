import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";
import { removeClosetFiles, signedImageUrls } from "./storage";

function fakeClient(bucket: Record<string, unknown>) {
  return {
    storage: { from: vi.fn(() => bucket) },
  } as unknown as SupabaseClient<Database>;
}

describe("signedImageUrls", () => {
  it("signs unique paths in one request and maps them", async () => {
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({
        path,
        signedUrl: `https://x/${path}`,
        error: null,
      })),
      error: null,
    }));
    const urls = await signedImageUrls(fakeClient({ createSignedUrls }), [
      "a.webp",
      "b.webp",
      "a.webp",
      "",
    ]);

    expect(createSignedUrls).toHaveBeenCalledWith(["a.webp", "b.webp"], 3600);
    expect(urls.get("b.webp")).toBe("https://x/b.webp");
    expect(urls.size).toBe(2);
  });

  it("makes no request for an empty list", async () => {
    const createSignedUrls = vi.fn();
    expect(
      (await signedImageUrls(fakeClient({ createSignedUrls }), [])).size,
    ).toBe(0);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });
});

describe("removeClosetFiles", () => {
  it("removes only real paths", async () => {
    const remove = vi.fn(async () => ({ data: [], error: null }));
    expect(
      await removeClosetFiles(fakeClient({ remove }), [
        "a.jpg",
        null,
        undefined,
      ]),
    ).toBe(true);
    expect(remove).toHaveBeenCalledWith(["a.jpg"]);
  });

  it("reports failure", async () => {
    const remove = vi.fn(async () => ({ data: null, error: new Error("no") }));
    expect(await removeClosetFiles(fakeClient({ remove }), ["a.jpg"])).toBe(
      false,
    );
  });
});
