import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav, isActive } from "./app-nav";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("isActive", () => {
  it("matches Home only on /", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/closet", "/")).toBe(false);
  });

  it("matches a tab and its sub-pages", () => {
    expect(isActive("/closet", "/closet")).toBe(true);
    expect(isActive("/closet/new", "/closet")).toBe(true);
    expect(isActive("/closets", "/closet")).toBe(false);
    expect(isActive("/outfits", "/closet")).toBe(false);
  });
});

describe("BottomNav", () => {
  it("shows the five sections and marks the current one", () => {
    pathname.current = "/outfits/new";
    render(<BottomNav />);

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "Home",
      "Closet",
      "Outfits",
      "Calendar",
      "Profile",
    ]);
    expect(screen.getByRole("link", { name: "Outfits" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
