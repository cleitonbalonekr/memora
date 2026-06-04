import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormState } from "@/shared/actions/form-state";
import { DeckForm } from "./deck-form";

describe("DeckForm", () => {
  it("renders the title field, optional description, and submit control", () => {
    const action = vi.fn(async () => ({ status: "idle" }) as FormState);
    render(
      <DeckForm
        action={action}
        pendingLabel="Creating..."
        submitLabel="Create deck"
      />,
    );

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create deck/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills fields from defaultValues for editing", () => {
    const action = vi.fn(async () => ({ status: "idle" }) as FormState);
    render(
      <DeckForm
        action={action}
        defaultValues={{ title: "Biology", description: "Cell unit" }}
        pendingLabel="Saving..."
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Biology");
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      "Cell unit",
    );
  });

  it("shows the field error returned by the action on submit", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async () =>
        ({
          status: "error",
          message: "Check the highlighted fields.",
          fieldErrors: { title: "Enter a title for the deck." },
        }) as FormState,
    );
    render(
      <DeckForm
        action={action}
        pendingLabel="Creating..."
        submitLabel="Create deck"
      />,
    );

    await user.type(screen.getByLabelText("Title"), "x");
    await user.click(screen.getByRole("button", { name: /create deck/i }));

    expect(
      await screen.findByText("Enter a title for the deck."),
    ).toBeInTheDocument();
  });
});
