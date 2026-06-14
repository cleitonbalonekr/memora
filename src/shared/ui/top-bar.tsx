import Link from "next/link";
import { User } from "lucide-react";

// Sticky top bar. On mobile it shows the "Memora" wordmark; on desktop the
// wordmark lives in the sidebar, so this side is an empty spacer. The avatar is
// a plain link to /settings (Logout lives there) — no dropdown, so this stays a
// server component. Search/notifications/help from the design are omitted in v1
// until backed by real behavior.
export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-lg py-md backdrop-blur-md">
      <div className="md:hidden">
        <span className="text-headline-sm font-bold text-primary">Memora</span>
      </div>
      <div className="hidden md:block" aria-hidden="true" />

      <Link
        aria-label="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container-low text-on-surface-variant transition-colors hover:text-primary"
        href="/settings"
      >
        <User aria-hidden="true" className="h-5 w-5" />
      </Link>
    </header>
  );
}
