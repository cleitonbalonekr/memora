import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyCard } from "@/features/study/domain/study-session";
import { StudyRunner } from "./study-runner";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

function cards(...ids: string[]): StudyCard[] {
  return ids.map((id) => ({
    id,
    frontText: `front ${id}`,
    backText: `back ${id}`,
  }));
}

function renderRunner(deckCards: StudyCard[]) {
  return render(
    <StudyRunner cards={deckCards} deckId="deck-1" deckTitle="Anatomy" />,
  );
}

describe("StudyRunner", () => {
  it("shows the first front and hides the mark actions until reveal", () => {
    renderRunner(cards("a", "b"));

    expect(screen.getByText("front a")).toBeInTheDocument();
    expect(screen.queryByText("back a")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /got it/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /review again/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals the back and the mark actions when the answer is revealed", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    await user.click(screen.getByRole("button", { name: /reveal answer/i }));

    expect(screen.getByText("back a")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /review again/i }),
    ).toBeInTheDocument();
  });

  it("advances to the next card and the progress count after Got it", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    expect(screen.getByText("0 / 2 Cards")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reveal answer/i }));
    await user.click(screen.getByRole("button", { name: /got it/i }));

    expect(screen.getByText("front b")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 Cards")).toBeInTheDocument();
    // Back of the next card is hidden again until revealed.
    expect(screen.queryByText("back b")).not.toBeInTheDocument();
  });

  it("re-queues a card to the end after Review again", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    await user.click(screen.getByRole("button", { name: /reveal answer/i }));
    await user.click(screen.getByRole("button", { name: /review again/i }));

    // 'a' was sent to the tail, so 'b' is current now and progress is unchanged.
    expect(screen.getByText("front b")).toBeInTheDocument();
    expect(screen.getByText("0 / 2 Cards")).toBeInTheDocument();

    // Clear 'b', then 'a' returns.
    await user.click(screen.getByRole("button", { name: /reveal answer/i }));
    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.getByText("front a")).toBeInTheDocument();
  });

  it("shows the completion summary once every card is cleared and can restart", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a"));

    await user.click(screen.getByRole("button", { name: /reveal answer/i }));
    await user.click(screen.getByRole("button", { name: /got it/i }));

    expect(screen.getByText("Session complete")).toBeInTheDocument();
    expect(screen.getByText("You cleared 1 card.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /study again/i }));

    expect(screen.getByText("front a")).toBeInTheDocument();
    expect(screen.getByText("0 / 1 Cards")).toBeInTheDocument();
  });
});
