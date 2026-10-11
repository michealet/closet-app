import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ClosetGrid } from "./closet-grid";

it("links each item to its detail page with its name as alt text", () => {
  render(
    <ClosetGrid
      items={[
        {
          id: "a",
          name: "Linen shirt",
          photoUrl: "https://x.test/a.webp",
          isFavorite: true,
        },
        { id: "b", name: "Jeans", photoUrl: null, isFavorite: false },
      ]}
    />,
  );
  expect(screen.getByRole("img", { name: "Linen shirt" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Jeans" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Linen shirt/ })).toHaveAttribute(
    "href",
    "/closet/a",
  );
});
