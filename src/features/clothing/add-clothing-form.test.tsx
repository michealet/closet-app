import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AddClothingForm } from "./add-clothing-form";

const { upload, save, remove, push } = vi.hoisted(() => ({
  upload: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("./actions", () => ({ addClothing: save }));
vi.mock("@/lib/images/upload", () => ({ uploadItemPhoto: upload }));
vi.mock("@/lib/images/storage", () => ({ removeClosetFiles: remove }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
const uploaded = {
  itemId: "id",
  imagePath: "full.jpg",
  thumbnailPath: "thumb.jpg",
};
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  upload.mockResolvedValue(uploaded);
  save.mockResolvedValue({ status: "success", message: "Saved" });
  remove.mockResolvedValue(true);
});
function submit() {
  render(<AddClothingForm />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Blue shirt" },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "tops" },
  });
  const form = screen
    .getByRole("button", { name: "Save clothing" })
    .closest("form")!;
  const photo = new File(["photo"], "shirt.jpg", { type: "image/jpeg" });
  const data = new FormData(form);
  data.set("photo", photo);
  vi.spyOn(globalThis, "FormData").mockImplementationOnce(function () {
    return data;
  });
  fireEvent.submit(form);
}
it("sends only details and uploaded paths to the action and opens the closet", async () => {
  submit();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet"));
  expect(save).toHaveBeenCalledWith({
    name: "Blue shirt",
    category: "tops",
    ...uploaded,
  });
  expect(remove).not.toHaveBeenCalled();
});
it("cleans up rejected uploads and preserves form details for retry", async () => {
  save.mockResolvedValue({ status: "error", message: "Try again" });
  submit();
  await screen.findByRole("alert");
  expect(remove.mock.calls[0][1]).toEqual(["full.jpg", "thumb.jpg"]);
  expect(screen.getByLabelText("Name")).toHaveValue("Blue shirt");
  expect(push).not.toHaveBeenCalled();
});
it("keeps photos when a lost response might hide a successful save", async () => {
  save.mockRejectedValue(new Error("connection lost"));
  submit();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Check your closet",
  );
  expect(remove).not.toHaveBeenCalled();
});
