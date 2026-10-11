import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HeartButton } from "./heart-button";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

it("fills in at once and saves in the background", async () => {
  const action = vi.fn().mockResolvedValue({ status: "success", message: "" });
  render(
    <HeartButton id="a" name="Shirt" isFavorite={false} action={action} />,
  );
  const heart = screen.getByRole("button", { name: "Favorite Shirt" });
  fireEvent.click(heart);
  expect(heart).toHaveAttribute("aria-pressed", "true");
  await waitFor(() =>
    expect(action).toHaveBeenCalledWith({ id: "a", isFavorite: true }),
  );
  expect(heart).toHaveAttribute("aria-pressed", "true");
});

it("goes back and shows an error when the save fails", async () => {
  const action = vi
    .fn()
    .mockResolvedValue({ status: "error", message: "Couldn't update" });
  render(<HeartButton id="a" name="Shirt" isFavorite action={action} />);
  const heart = screen.getByRole("button", { name: "Favorite Shirt" });
  fireEvent.click(heart);
  expect(heart).toHaveAttribute("aria-pressed", "false");
  await waitFor(() => expect(heart).toHaveAttribute("aria-pressed", "true"));
  expect(toastError).toHaveBeenCalledWith("Couldn't update");
});
