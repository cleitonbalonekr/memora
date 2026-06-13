import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyCard } from "@/features/study/domain/study-session";
import { StudyRunner } from "./study-runner";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

const reviewCardAction = vi.fn().mockResolvedValue({ status: "success" });
vi.mock("@/app/(app)/decks/[deckId]/study/actions", () => ({
  reviewCardAction: (input: unknown) => reviewCardAction(input),
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

async function reveal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /reveal answer/i }));
}

describe("StudyRunner", () => {
  beforeEach(() => {
    reviewCardAction.mockClear();
  });

  it("hides the grade actions until the answer is revealed", () => {
    renderRunner(cards("a", "b"));

    expect(screen.getByText("front a")).toBeInTheDocument();
    expect(screen.queryByText("back a")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /medium/i })).not.toBeInTheDocument();
  });

  it("reveals the back and the four grading buttons", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    await reveal(user);

    expect(screen.getByText("back a")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /don't know/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^hard$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /easy/i })).toBeInTheDocument();
  });

  it("advances and records the grade per press on a passing grade", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    expect(screen.getByText("0 / 2 Cards")).toBeInTheDocument();

    await reveal(user);
    await user.click(screen.getByRole("button", { name: /medium/i }));

    expect(reviewCardAction).toHaveBeenCalledWith({ cardId: "a", grade: "good" });
    expect(screen.getByText("front b")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 Cards")).toBeInTheDocument();
  });

  it("re-shows the card after Don't know and records again", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a", "b"));

    await reveal(user);
    await user.click(screen.getByRole("button", { name: /don't know/i }));

    expect(reviewCardAction).toHaveBeenCalledWith({ cardId: "a", grade: "again" });
    // 'a' went to the tail; 'b' is current and progress is unchanged.
    expect(screen.getByText("front b")).toBeInTheDocument();
    expect(screen.getByText("0 / 2 Cards")).toBeInTheDocument();

    // Clear 'b', then 'a' returns.
    await reveal(user);
    await user.click(screen.getByRole("button", { name: /easy/i }));
    expect(screen.getByText("front a")).toBeInTheDocument();
  });

  it("shows the completion summary once every card is cleared and can restart", async () => {
    const user = userEvent.setup();
    renderRunner(cards("a"));

    await reveal(user);
    await user.click(screen.getByRole("button", { name: /medium/i }));

    expect(screen.getByText("Session complete")).toBeInTheDocument();
    expect(screen.getByText("You cleared 1 card.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /study again/i }));

    expect(screen.getByText("front a")).toBeInTheDocument();
    expect(screen.getByText("0 / 1 Cards")).toBeInTheDocument();
  });
});
