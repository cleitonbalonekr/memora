import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  GenerateDraftsActionResult,
  SaveDraftsActionResult,
} from "@/app/(app)/decks/[deckId]/generate/actions";
import type { CardDraft } from "@/features/ai/domain/draft-schema";
import { DraftReview } from "./draft-review";

type GenerateAction = (topicOrNotes: string) => Promise<GenerateDraftsActionResult>;
type SaveAction = (drafts: CardDraft[]) => Promise<SaveDraftsActionResult>;

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

function setup(
  generateAction: GenerateAction = vi.fn<GenerateAction>(async () => ({
    status: "success",
    drafts: [
      { frontText: "What is mitosis?", backText: "Cell division." },
      { frontText: "What is meiosis?", backText: "Gamete division." },
    ],
  })),
  saveAction: SaveAction = vi.fn<SaveAction>(async () => ({
    status: "success",
    savedCount: 1,
  })),
) {
  render(
    <DraftReview
      deckId="deck-1"
      deckTitle="Biology"
      generateAction={generateAction}
      saveAction={saveAction}
    />,
  );
  return { generateAction, saveAction };
}

async function generate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Topic or notes"), "Cell biology");
  await user.click(screen.getByRole("button", { name: /generate drafts/i }));
}

describe("DraftReview", () => {
  it("renders editable drafts after generating", async () => {
    const user = userEvent.setup();
    setup();
    await generate(user);

    expect(await screen.findByDisplayValue("What is mitosis?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What is meiosis?")).toBeInTheDocument();
  });

  it("saves only the selected drafts with edits applied", async () => {
    const user = userEvent.setup();
    const { saveAction } = setup();
    await generate(user);

    // Edit the first draft's back text.
    await screen.findByDisplayValue("What is mitosis?");
    const firstBack = screen.getAllByLabelText("Back (answer)")[0];
    await user.clear(firstBack);
    await user.type(firstBack, "Somatic cell division.");

    // Deselect the second draft.
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("button", { name: /save 1 card/i }));

    expect(saveAction).toHaveBeenCalledWith([
      { frontText: "What is mitosis?", backText: "Somatic cell division." },
    ]);
  });

  it("blocks saving when a selected draft has an empty side", async () => {
    const user = userEvent.setup();
    const { saveAction } = setup();
    await generate(user);

    await screen.findByDisplayValue("What is mitosis?");
    const firstBack = screen.getAllByLabelText("Back (answer)")[0];
    await user.clear(firstBack);

    const saveButton = screen.getByRole("button", { name: /save .* cards?/i });
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);
    expect(saveAction).not.toHaveBeenCalled();
  });

  it("surfaces a generation error message", async () => {
    const user = userEvent.setup();
    const generateAction = vi.fn<GenerateAction>(async () => ({
      status: "error",
      message: "Too many requests. Try again in 30 seconds.",
    }));
    setup(generateAction);
    await generate(user);

    expect(
      await screen.findByText("Too many requests. Try again in 30 seconds."),
    ).toBeInTheDocument();
    expect(within(document.body).queryAllByRole("checkbox")).toHaveLength(0);
  });
});
