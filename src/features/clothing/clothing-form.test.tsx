import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ClothingForm, type EditableItem } from "./clothing-form";

const { upload, save, update, remove, push } = vi.hoisted(() => ({
  upload: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("./actions", () => ({ addClothing: save, updateClothing: update }));
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
  update.mockResolvedValue({ status: "success", message: "Changes saved." });
  remove.mockResolvedValue(true);
});
function submit(another = false) {
  render(<ClothingForm />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Blue shirt" },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "tops" },
  });
  if (another) {
    fireEvent.change(screen.getByLabelText("Brand (optional)"), {
      target: { value: "Uniqlo" },
    });
    fireEvent.change(screen.getByLabelText("Notes (optional)"), {
      target: { value: "Cotton" },
    });
    fireEvent.click(screen.getByLabelText("Blue"));
    fireEvent.click(screen.getByLabelText("All Season"));
  }
  const form = screen
    .getByRole("button", { name: "Save clothing" })
    .closest("form")!;
  const photo = new File(["photo"], "shirt.jpg", { type: "image/jpeg" });
  const data = new FormData(form);
  data.set("photo", photo);
  vi.spyOn(globalThis, "FormData").mockImplementationOnce(function () {
    return data;
  });
  fireEvent(
    form,
    new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: another
        ? (screen.getByRole("button", {
            name: "Save & add another",
          }) as HTMLButtonElement)
        : null,
    }),
  );
}
it("sends only details and uploaded paths to the action and opens the closet", async () => {
  submit();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet"));
  expect(save).toHaveBeenCalledWith({
    name: "Blue shirt",
    category: "tops",
    brand: null,
    notes: null,
    colors: [],
    seasons: [],
    ...uploaded,
  });
  expect(remove).not.toHaveBeenCalled();
});
it("clears fields and stays on Add clothing after Save & add another", async () => {
  submit(true);
  await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
  expect(screen.getByLabelText("Category")).toHaveValue("");
  expect(screen.getByLabelText("Photo")).toHaveValue("");
  await waitFor(() => expect(screen.getByLabelText("Photo")).toHaveFocus());
  expect(screen.getByLabelText("Brand (optional)")).toHaveValue("");
  expect(screen.getByLabelText("Notes (optional)")).toHaveValue("");
  expect(screen.getByLabelText("Blue")).not.toBeChecked();
  expect(screen.getByLabelText("All Season")).not.toBeChecked();
  expect(screen.getByText("Uniqlo")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
it("keeps optional details when Save & add another fails", async () => {
  save.mockResolvedValue({ status: "error", message: "Try again" });
  submit(true);
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Brand (optional)")).toHaveValue("Uniqlo");
  expect(screen.getByLabelText("Blue")).toBeChecked();
  expect(screen.getByLabelText("All Season")).toBeChecked();
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

const item: EditableItem = {
  id: "item-1",
  name: "Linen shirt",
  category: "tops",
  brand: "Uniqlo",
  notes: "Soft",
  colors: ["white"],
  seasons: ["summer"],
  imagePath: "u/items/item-1.webp",
  thumbnailPath: "u/items/item-1_thumb.webp",
  photoUrl: null,
};
function submitEdit(photo?: File) {
  render(<ClothingForm item={item} />);
  const form = screen
    .getByRole("button", { name: "Save changes" })
    .closest("form")!;
  if (photo) {
    const data = new FormData(form);
    data.set("photo", photo);
    vi.spyOn(globalThis, "FormData").mockImplementationOnce(function () {
      return data;
    });
  }
  fireEvent.submit(form);
}
it("pre-fills Edit and saves changes without requiring a new photo", async () => {
  submitEdit();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet/item-1"));
  expect(screen.getByLabelText("Brand (optional)")).toHaveValue("Uniqlo");
  expect(screen.getByLabelText("White")).toBeChecked();
  expect(screen.queryByText("Save & add another")).not.toBeInTheDocument();
  expect(upload).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith({
    itemId: "item-1",
    name: "Linen shirt",
    category: "tops",
    brand: "Uniqlo",
    notes: "Soft",
    colors: ["white"],
    seasons: ["summer"],
  });
});
it("replaces the photo and removes the old files when the format changed", async () => {
  submitEdit(new File(["photo"], "new.jpg", { type: "image/jpeg" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet/item-1"));
  expect(upload.mock.calls[0][1]).toBe("item-1");
  expect(update.mock.calls[0][0]).toMatchObject({
    imagePath: "full.jpg",
    thumbnailPath: "thumb.jpg",
  });
  expect(remove.mock.calls[0][1]).toEqual([item.imagePath, item.thumbnailPath]);
});
it("keeps the files when a replaced photo reused the same paths", async () => {
  upload.mockResolvedValue({
    itemId: item.id,
    imagePath: item.imagePath,
    thumbnailPath: item.thumbnailPath,
  });
  submitEdit(new File(["photo"], "new.webp", { type: "image/webp" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet/item-1"));
  expect(remove).not.toHaveBeenCalled();
});
it("removes a new-format photo when saving the edit fails", async () => {
  update.mockResolvedValue({ status: "error", message: "Try again" });
  submitEdit(new File(["photo"], "new.jpg", { type: "image/jpeg" }));
  await screen.findByRole("alert");
  expect(remove.mock.calls[0][1]).toEqual(["full.jpg", "thumb.jpg"]);
  expect(push).not.toHaveBeenCalled();
});
