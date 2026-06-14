import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

// The single global chrome for authenticated pages: desktop sidebar + mobile
// bottom nav + sticky top bar, wrapping a scrollable main. The shell owns the
// background, the centered content container, scroll, and padding that each
// page used to hand-roll — pages now render only their own content. Extra
// bottom padding on mobile clears the fixed bottom nav.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface text-on-surface">
      <SideNav />

      <div className="flex h-dvh flex-1 flex-col overflow-y-auto md:ml-64">
        <TopBar />

        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-[600px] flex-col gap-lg px-margin-mobile py-lg pb-28 md:pb-lg">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
