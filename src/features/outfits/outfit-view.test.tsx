import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { OutfitView } from "./outfit-view";

it("places each piece by its saved centre and width, in layer order", () => {
  const { container } = render(
    <OutfitView
      name="Friday dinner"
      pieces={[
        {
          id: "b",
          name: "Jeans",
          photoUrl: "/b.jpg",
          x: 0.5,
          y: 0.62,
          width: 0.24,
          z: 1,
        },
        {
          id: "a",
          name: "Top",
          photoUrl: "/a.jpg",
          x: 0.25,
          y: 0.3,
          width: 0.4,
          z: 0,
        },
      ]}
    />,
  );
  expect(
    screen.getByRole("img", { name: "Friday dinner: Jeans, Top" }),
  ).toBeInTheDocument();
  const [top, jeans] = container.querySelectorAll("img");
  expect(top).toHaveAttribute("src", "/a.jpg");
  expect(top.style).toMatchObject({ left: "25%", top: "30%", width: "40%" });
  expect(jeans.style).toMatchObject({ left: "50%", top: "62%", width: "24%" });
});
