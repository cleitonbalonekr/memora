import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDeckButton } from "./delete-deck-button";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DeleteDeckButton", () => {
  it("submits the delete action once the user confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn(async () => {});
    const user = userEvent.setup();

    render(<DeleteDeckButton action={action} deckTitle="Spanish" />);
    await user.click(screen.getByRole("button", { name: /delete deck/i }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledOnce();
  });

  it("does not submit when the user cancels the confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn(async () => {});
    const user = userEvent.setup();

    render(<DeleteDeckButton action={action} deckTitle="Spanish" />);
    await user.click(screen.getByRole("button", { name: /delete deck/i }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });
});
