import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

// The Server Action needs a request context; the form's UI doesn't.
vi.mock("./actions", () => ({ authenticate: vi.fn() }));

describe("LoginForm", () => {
  it("starts in sign-in mode", () => {
    render(<LoginForm next="/account" />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.queryByText(/at least \d+ characters/i)).toBeNull();
  });

  it("switches to sign-up mode and back", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm next="/closet" />);
    const intent = () =>
      container.querySelector<HTMLInputElement>('input[name="intent"]')?.value;

    await user.click(
      screen.getByRole("button", { name: "New here? Create an account" }),
    );

    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByText(/at least 8 characters/i)).toBeVisible();
    expect(intent()).toBe("signup");

    await user.click(
      screen.getByRole("button", { name: "Already have an account? Sign in" }),
    );

    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(intent()).toBe("signin");
  });

  it("sets up the email field for iPhone shortcuts and saved logins", () => {
    render(<LoginForm next="/" />);
    const email = screen.getByLabelText("Email");

    // type="email" disables iOS autocorrect and Text Replacement (#14).
    expect(email).toHaveAttribute("type", "text");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(email).toHaveAttribute("autocorrect", "on");
    expect(email).toHaveAttribute("autocapitalize", "none");
    expect(email).toHaveAttribute("spellcheck", "false");
    expect(email).toHaveAttribute("autocomplete", "username");
  });

  it("carries the return path", () => {
    const { container } = render(<LoginForm next="/closet" />);
    expect(container.querySelector('input[name="next"]')).toHaveValue(
      "/closet",
    );
  });
});
