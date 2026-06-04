"use client";

interface DeleteDeckButtonProps {
  action: () => Promise<void>;
  deckTitle: string;
}

export function DeleteDeckButton({ action, deckTitle }: DeleteDeckButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete "${deckTitle}" and all of its cards? This cannot be undone.`,
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        className="flex h-12 w-full items-center justify-center rounded-xl border border-error px-md text-label-md text-error transition hover:bg-error-container"
        type="submit"
      >
        Delete deck
      </button>
    </form>
  );
}
