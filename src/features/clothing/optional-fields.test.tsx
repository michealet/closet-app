import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ClothingOptionalFields } from "./optional-fields";

it("offers used brands and supports several color selections", () => {
  render(
    <form>
      <ClothingOptionalFields brands={["Uniqlo"]} />
    </form>,
  );
  expect(screen.getByText("Uniqlo")).toHaveAttribute("value", "Uniqlo");
  fireEvent.click(screen.getByLabelText("Blue"));
  fireEvent.click(screen.getByLabelText("White"));
  const form = screen.getByLabelText("Brand (optional)").closest("form")!;
  expect(new FormData(form).getAll("colors")).toEqual(["white", "blue"]);
});
it("All Season selects all four seasons, and individual seasons can be removed", () => {
  render(<ClothingOptionalFields brands={[]} />);
  fireEvent.click(screen.getByLabelText("All Season"));
  for (const season of ["Spring", "Summer", "Fall", "Winter"])
    expect(screen.getByLabelText(season)).toBeChecked();
  fireEvent.click(screen.getByLabelText("Spring"));
  expect(screen.getByLabelText("All Season")).not.toBeChecked();
  expect(screen.getByLabelText("Summer")).toBeChecked();
  fireEvent.click(screen.getByLabelText("All Season"));
  fireEvent.click(screen.getByLabelText("All Season"));
  expect(screen.getByLabelText("Summer")).not.toBeChecked();
});
