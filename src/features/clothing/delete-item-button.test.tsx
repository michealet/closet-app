import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { DeleteItemButton, deleteWarning } from "./delete-item-button";

const { remove, push, toastError } = vi.hoisted(() => ({
  remove: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));
vi.mock("./actions", () => ({ deleteClothing: remove }));

beforeEach(() => {
  vi.clearAllMocks();
  remove.mockResolvedValue({ status: "success", message: "Item deleted." });
});

it("says how many outfits lose the item (ID-5)", () => {
  expect(deleteWarning(0)).toBe("This can't be undone.");
  expect(deleteWarning(1)).toBe(
    "This item is in 1 outfit. It will be removed from it. This can't be undone.",
  );
  expect(deleteWarning(3)).toMatch(
    /^This item is in 3 outfits\. It will be removed from them\./,
  );
});

it("asks first, then deletes and opens the closet", async () => {
  render(<DeleteItemButton itemId="i" name="Jeans" outfitCount={3} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(await screen.findByText("Delete Jeans?")).toBeInTheDocument();
  expect(screen.getByText(/in 3 outfits/)).toBeInTheDocument();
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
  await waitFor(() => expect(push).toHaveBeenCalledWith("/closet"));
  expect(remove).toHaveBeenCalledWith("i");
});

it("stays put and shows the error when deleting fails", async () => {
  remove.mockResolvedValue({ status: "error", message: "Try again" });
  render(<DeleteItemButton itemId="i" name="Jeans" outfitCount={0} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await screen.findByText("Delete Jeans?");
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
  await waitFor(() => expect(toastError).toHaveBeenCalledWith("Try again"));
  expect(push).not.toHaveBeenCalled();
});
