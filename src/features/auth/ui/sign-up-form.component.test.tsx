import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(auth)/actions", () => ({
  signUpAction: vi.fn(async () => ({
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: { password: "Use at least 8 characters." },
  })),
}));

// next/link needs the app-router context; a plain anchor is enough here.
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

import { SignUpForm } from "./sign-up-form";

describe("SignUpForm", () => {
  it("renders the fields, password guidance, and submit control", () => {
    render(<SignUpForm nextPath="/decks" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByText("Use 8+ characters with uppercase, lowercase, and a number."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows the password error returned by the action on submit", async () => {
    const user = userEvent.setup();
    render(<SignUpForm nextPath="/decks" />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "weak");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Use at least 8 characters.")).toBeInTheDocument();
  });
});
