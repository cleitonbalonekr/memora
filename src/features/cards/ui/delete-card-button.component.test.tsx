import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteCardButton } from "./delete-card-button";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DeleteCardButton", () => {
  it("submits the delete action once the user confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn(async () => {});
    const user = userEvent.setup();

    render(<DeleteCardButton action={action} />);
    await user.click(screen.getByRole("button", { name: /delete card/i }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledOnce();
  });

  it("does not submit when the user cancels the confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn(async () => {});
    const user = userEvent.setup();

    render(<DeleteCardButton action={action} />);
    await user.click(screen.getByRole("button", { name: /delete card/i }));

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });
});
