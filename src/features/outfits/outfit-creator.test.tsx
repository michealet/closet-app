import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { CanvasItem } from "./layout";
import { OutfitCreator, type PickerItem } from "./outfit-creator";

// jsdom has no canvas: stand in for Konva with a list of what's placed.
vi.mock("next/dynamic", () => ({
  default: () =>
    function Canvas({ items }: { items: CanvasItem[] }) {
      return (
        <ol aria-label="On the canvas">
          {items.map((item) => (
            <li key={item.id}>{`${item.id} ${item.x} ${item.y} ${item.z}`}</li>
          ))}
        </ol>
      );
    },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("./actions", () => ({ saveOutfit: vi.fn() }));
vi.mock("@/lib/images/upload", () => ({ uploadOutfitThumbnail: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

const closet: PickerItem[] = [
  { id: "shirt", name: "Blue shirt", category: "tops", photoUrl: null },
  { id: "jeans", name: "Black jeans", category: "bottoms", photoUrl: null },
  { id: "boots", name: "Black boots", category: "shoes", photoUrl: null },
];
const placed = () =>
  within(screen.getByRole("list", { name: "On the canvas" }))
    .queryAllByRole("listitem")
    .map((item) => item.textContent!.split(" ")[0]);
const piece = (name: string) => screen.getByRole("button", { name });

it("adds a piece on tap, marks it, and removes it on a second tap", () => {
  render(<OutfitCreator closet={closet} />);
  fireEvent.click(piece("Blue shirt"));
  fireEvent.click(piece("Black jeans"));
  expect(placed()).toEqual(["shirt", "jeans"]);
  expect(piece("Blue shirt")).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(piece("Blue shirt"));
  expect(placed()).toEqual(["jeans"]);
  expect(piece("Blue shirt")).toHaveAttribute("aria-pressed", "false");
});

it("places new pieces by category, each on top", () => {
  render(<OutfitCreator closet={closet} />);
  fireEvent.click(piece("Black boots"));
  fireEvent.click(piece("Blue shirt"));
  const [boots, shirt] = screen
    .getAllByRole("listitem")
    .map((item) => item.textContent!.split(" ").map(Number));
  expect(shirt[2]).toBeLessThan(boots[2]);
  expect(shirt[3]).toBeGreaterThan(boots[3]);
});

it("filters the picker by category and name", () => {
  render(<OutfitCreator closet={closet} />);
  const chips = within(screen.getByRole("group", { name: "Category" }));
  expect(chips.queryByRole("button", { name: "Dresses" })).toBeNull();

  fireEvent.click(chips.getByRole("button", { name: "Shoes" }));
  expect(screen.queryByRole("button", { name: "Blue shirt" })).toBeNull();
  expect(piece("Black boots")).toBeInTheDocument();

  fireEvent.click(chips.getByRole("button", { name: "All" }));
  fireEvent.change(screen.getByLabelText("Search your closet"), {
    target: { value: "BLACK" },
  });
  expect(screen.queryByRole("button", { name: "Blue shirt" })).toBeNull();
  expect(piece("Black jeans")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Search your closet"), {
    target: { value: "dress" },
  });
  expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
});

it("opens the Save form once something is on the canvas, and goes back", () => {
  render(<OutfitCreator closet={closet} />);
  const save = screen.getByRole("button", { name: "Save outfit" });
  expect(save).toBeDisabled();

  fireEvent.click(piece("Blue shirt"));
  fireEvent.click(save);
  expect(screen.getByRole("form", { name: "Save outfit" })).toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveFocus();
  expect(screen.queryByLabelText("Search your closet")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Back to closet" }));
  expect(screen.getByLabelText("Search your closet")).toBeInTheDocument();
  expect(placed()).toEqual(["shirt"]);
});
