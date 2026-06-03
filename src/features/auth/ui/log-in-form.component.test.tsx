import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Replace the server action so the form never imports server-only adapters
// (Supabase/Drizzle). The action just echoes an error state back to the form.
vi.mock("@/app/(auth)/actions", () => ({
  logInAction: vi.fn(async () => ({
    status: "error",
    message: "Email or password is incorrect.",
    fieldErrors: { email: "Use a valid email address." },
  })),
}));

import { LogInForm } from "./log-in-form";

describe("LogInForm", () => {
  it("renders the email, password, and submit controls", () => {
    render(<LogInForm nextPath="/decks" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows field and message errors returned by the action on submit", async () => {
    const user = userEvent.setup();
    render(<LogInForm nextPath="/decks" />);

    await user.type(screen.getByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Use a valid email address.")).toBeInTheDocument();
    expect(
      await screen.findByText("Email or password is incorrect."),
    ).toBeInTheDocument();
  });
});
