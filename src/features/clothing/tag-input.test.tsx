import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TagInput } from "./tag-input";

function tags() {
  return [
    ...document.querySelectorAll<HTMLInputElement>('input[name="tags"]'),
  ].map((input) => input.value);
}

it("adds tags with Enter, comma or Add, lowercase and once each", () => {
  render(<TagInput defaultTags={["linen"]} />);
  const draft = screen.getByLabelText("Tags (optional)");
  fireEvent.change(draft, { target: { value: "Thrifted" } });
  fireEvent.keyDown(draft, { key: "Enter" });
  fireEvent.change(draft, { target: { value: "work, LINEN" } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(tags()).toEqual(["linen", "thrifted", "work"]);
  expect(draft).toHaveValue("");
});

it("removes a tag when its chip is tapped", () => {
  render(<TagInput defaultTags={["linen", "work"]} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove tag linen" }));
  expect(tags()).toEqual(["work"]);
});
