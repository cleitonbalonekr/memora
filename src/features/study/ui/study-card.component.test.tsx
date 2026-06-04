import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyCard } from "./study-card";

const card = { id: "a", frontText: "What is the femur?", backText: "A bone." };

describe("StudyCard", () => {
  it("shows the front and a keyboard-operable reveal control when hidden", async () => {
    const onReveal = vi.fn();
    const user = userEvent.setup();
    render(<StudyCard card={card} onReveal={onReveal} revealed={false} />);

    expect(screen.getByText("What is the femur?")).toBeInTheDocument();
    expect(screen.queryByText("A bone.")).not.toBeInTheDocument();

    // Operable via keyboard (focus + Enter), not just click.
    await user.tab();
    expect(screen.getByRole("button", { name: /reveal answer/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onReveal).toHaveBeenCalledOnce();
  });

  it("shows the back in a live region once revealed", () => {
    render(<StudyCard card={card} onReveal={vi.fn()} revealed />);

    expect(screen.getByText("A bone.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reveal answer/i }),
    ).not.toBeInTheDocument();
  });
});
