"use client";

interface DeleteCardButtonProps {
  action: () => Promise<void>;
}

export function DeleteCardButton({ action }: DeleteCardButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Delete this card? This cannot be undone.",
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
        Delete card
      </button>
    </form>
  );
}
