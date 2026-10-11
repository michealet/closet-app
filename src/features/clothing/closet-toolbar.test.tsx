import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NO_FILTERS } from "./closet-filters";
import { ClosetToolbar } from "./closet-toolbar";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

it("filters by category from the chips", () => {
  render(<ClosetToolbar filters={NO_FILTERS} brands={[]} tags={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Dresses" }));
  expect(replace).toHaveBeenCalledWith("/closet?category=dresses", {
    scroll: false,
  });
});

it("searches after a short pause while typing", () => {
  vi.useFakeTimers();
  render(<ClosetToolbar filters={NO_FILTERS} brands={[]} tags={[]} />);
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "linen" },
  });
  expect(replace).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(300));
  expect(replace).toHaveBeenCalledWith("/closet?q=linen", { scroll: false });
});

it("shows active filters as removable chips and keeps the others", () => {
  render(
    <ClosetToolbar
      filters={{ ...NO_FILTERS, color: "navy", tag: "linen" }}
      brands={["Zara"]}
      tags={["linen"]}
    />,
  );
  expect(screen.getByRole("button", { name: /Filters \(2\)/ })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Remove filter Navy" }));
  expect(replace).toHaveBeenCalledWith("/closet?tag=linen", { scroll: false });
});

it("combines filters from the panel", () => {
  render(
    <ClosetToolbar
      filters={{ ...NO_FILTERS, category: "tops" }}
      brands={["Zara"]}
      tags={[]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
  fireEvent.change(screen.getByLabelText("Brand"), {
    target: { value: "Zara" },
  });
  expect(replace).toHaveBeenCalledWith("/closet?category=tops&brand=Zara", {
    scroll: false,
  });
});
