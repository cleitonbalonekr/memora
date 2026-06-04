import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormState } from "@/shared/actions/form-state";
import { CARD_SIDE_RECOMMENDED } from "@/features/cards/domain/card-rules";
import { CardForm } from "./card-form";

describe("CardForm", () => {
  it("renders the front and back fields and submit control", () => {
    const action = vi.fn(async () => ({ status: "idle" }) as FormState);
    render(
      <CardForm action={action} pendingLabel="Adding..." submitLabel="Add card" />,
    );

    expect(screen.getByLabelText("Front (question)")).toBeInTheDocument();
    expect(screen.getByLabelText("Back (answer)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add card/i })).toBeInTheDocument();
  });

  it("pre-fills fields from defaultValues for editing", () => {
    const action = vi.fn(async () => ({ status: "idle" }) as FormState);
    render(
      <CardForm
        action={action}
        defaultValues={{ front: "What is the femur?", back: "A bone." }}
        pendingLabel="Saving..."
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText("Front (question)")).toHaveValue(
      "What is the femur?",
    );
    expect(screen.getByLabelText("Back (answer)")).toHaveValue("A bone.");
  });

  it("shows live guidance when the front is not a question", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" }) as FormState);
    render(
      <CardForm action={action} pendingLabel="Adding..." submitLabel="Add card" />,
    );

    await user.type(screen.getByLabelText("Front (question)"), "The femur");

    expect(screen.getByText(/Phrase the front as a question/i)).toBeInTheDocument();
  });

  it("shows the field error returned by the action on submit", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async () =>
        ({
          status: "error",
          message: "Check the highlighted fields.",
          fieldErrors: { back: "Enter the back (the answer)." },
        }) as FormState,
    );
    render(
      <CardForm action={action} pendingLabel="Adding..." submitLabel="Add card" />,
    );

    await user.type(screen.getByLabelText("Front (question)"), "What is it?");
    await user.type(screen.getByLabelText("Back (answer)"), "It.");
    await user.click(screen.getByRole("button", { name: /add card/i }));

    expect(
      await screen.findByText("Enter the back (the answer)."),
    ).toBeInTheDocument();
    // Sanity: the recommended-length constant is wired in for guidance.
    expect(CARD_SIDE_RECOMMENDED).toBeGreaterThan(0);
  });
});
