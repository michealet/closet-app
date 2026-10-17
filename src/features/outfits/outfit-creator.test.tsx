import { fireEvent, render, screen, within } from "@testing-library/react";
import Link from "next/link";
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

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("./actions", () => ({ saveOutfit: vi.fn(), updateOutfit: vi.fn() }));
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

const layers = () =>
  Object.fromEntries(
    within(screen.getByRole("list", { name: "On the canvas" }))
      .getAllByRole("listitem")
      .map((item) => item.textContent!.split(" "))
      .map(([id, , , z]) => [id, Number(z)]),
  );
const tool = (name: string) =>
  within(screen.getByRole("toolbar", { name: "Arrange piece" })).getByRole(
    "button",
    { name },
  );

it("arranges the chosen piece with buttons (OC-6)", () => {
  render(<OutfitCreator closet={closet} />);
  fireEvent.click(piece("Blue shirt"));
  fireEvent.click(piece("Black jeans"));
  const choose = screen.getByLabelText("Piece to arrange");
  expect(choose).toHaveValue("jeans");
  expect(tool("Bring forward")).toBeDisabled();

  fireEvent.click(tool("Send backward"));
  expect(layers()).toEqual({ shirt: 1, jeans: 0 });

  fireEvent.change(choose, { target: { value: "shirt" } });
  fireEvent.click(tool("Remove from outfit"));
  expect(placed()).toEqual(["jeans"]);
  expect(choose).toHaveValue("");
  expect(tool("Bigger")).toBeDisabled();
});

it("starts with the piece from Item Detail on the canvas (OC-13)", () => {
  render(<OutfitCreator closet={closet} startWith="boots" />);
  expect(placed()).toEqual(["boots"]);
  expect(piece("Black boots")).toHaveAttribute("aria-pressed", "true");
});

it("asks before leaving with an unsaved outfit (OC-12)", () => {
  render(
    <>
      <Link href="/closet">Closet</Link>
      <OutfitCreator closet={closet} />
    </>,
  );
  const link = screen.getByRole("link", { name: "Closet" });
  expect(fireEvent.click(link)).toBe(true);

  fireEvent.click(piece("Blue shirt"));
  expect(fireEvent.click(link)).toBe(false);
  expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(push).not.toHaveBeenCalled();

  fireEvent.click(link);
  fireEvent.click(screen.getByRole("button", { name: "Leave" }));
  expect(push).toHaveBeenCalledWith("/closet");
});

it("opens a saved outfit pre-filled and only warns once it's changed (OC-11)", () => {
  render(
    <>
      <Link href="/outfits">Outfits</Link>
      <OutfitCreator
        closet={closet}
        outfit={{
          id: "o1",
          name: "Friday dinner",
          occasion: "dinner",
          seasons: ["fall"],
          notes: "Warm",
          isFavorite: true,
          thumbnailPath: null,
          items: [{ id: "jeans", x: 0.5, y: 0.6, width: 0.3, z: 0 }],
        }}
      />
    </>,
  );
  expect(placed()).toEqual(["jeans"]);
  const link = screen.getByRole("link", { name: "Outfits" });
  expect(fireEvent.click(link)).toBe(true);

  fireEvent.click(piece("Blue shirt"));
  expect(fireEvent.click(link)).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));

  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByLabelText("Name")).toHaveValue("Friday dinner");
  expect(screen.getByLabelText("Occasion (optional)")).toHaveValue("dinner");
  expect(screen.getByLabelText("Fall")).toBeChecked();
  expect(screen.getByLabelText("Notes (optional)")).toHaveValue("Warm");
  expect(screen.getByLabelText("Add to favorites")).toBeChecked();
});
