## Why

The app has no shared UI chrome. `src/app/(app)/layout.tsx` only auth-gates and renders children raw, so every authenticated page hand-rolls its own full-screen shell (`<main>`, background, max-width container, bespoke header). This duplicates layout, lets navigation drift between screens, and does not match the `dashboard_mobile` design, which calls for a persistent desktop sidebar, a mobile bottom nav, and a top bar. There is also no home/overview screen and no place for global navigation, so users land directly on a raw deck list and Logout is stranded in one page's header.

## What Changes

- Add a global, responsive **app shell** (top bar + desktop sidebar + mobile bottom nav) rendered once in `src/app/(app)/layout.tsx`, wrapping all authenticated pages. Auth pages under `(auth)/` stay chrome-free.
- Introduce a **single nav-config** as the source of truth for navigation, consumed by both the sidebar and bottom nav so they cannot drift. Active route is highlighted via `usePathname()` with `aria-current`.
- Align the **information architecture** with the design: Dashboard, Library, Analytics, Settings (desktop sidebar + a "Create New Deck" button); Dashboard, Library, Create, Settings (mobile bottom nav — Analytics is dropped and Create is promoted, preserving the design's per-breakpoint difference).
- Add a new **`/dashboard`** screen (welcome banner, stats grid, Recent Decks) and make it the signed-in landing. Streak and Studied-Today render as clearly marked placeholders (not yet tracked); Recent Decks uses real deck data.
- Add **`/analytics`** ("Coming soon" placeholder) and **`/settings`** (a minimal real page that hosts the relocated Logout action).
- Update the signed-in landing redirect (`src/app/page.tsx`) from `/decks` to `/dashboard`.
- **Refactor** every existing `(app)` page to shed its own `<main>`/background/max-width wrapper and render into the shell-provided content area; relabel the deck list as "Library" and remove the now-orphaned Logout button from its header.
- Add **`lucide-react`** for SVG icons (offline-friendly, chosen over the design's Material Symbols CDN font because this is an installable PWA).

## Capabilities

### New Capabilities
- `app-shell-navigation`: persistent responsive chrome (top bar, desktop sidebar, mobile bottom nav), a single nav-config source of truth, active-route indication, the signed-in landing redirect, and the Analytics/Settings nav destinations (including Settings hosting Logout).
- `dashboard-overview`: the `/dashboard` landing screen — welcome banner, stats grid with placeholder (un-backed) metrics clearly marked as such, and a Recent Decks section sourced from real deck data.

### Modified Capabilities
<!-- None. Existing specs are backend/domain capabilities; this is additive web-layer work and does not change their documented requirements. The per-page refactor and Logout relocation are implementation details with no existing UI spec. -->

## Impact

- **New code:** `src/shared/ui/app-shell.tsx`, `side-nav.tsx`, `bottom-nav.tsx`, `top-bar.tsx`, and a nav-config module; new routes `src/app/(app)/dashboard/`, `analytics/`, `settings/`.
- **Modified code:** `src/app/(app)/layout.tsx` (wraps children in the shell), `src/app/page.tsx` (landing redirect → `/dashboard`), and all existing `(app)` pages (`decks/page.tsx`, `decks/[deckId]/page.tsx`, `decks/new`, `decks/[deckId]/edit`, `generate`, `study`, `cards/*`) to render into the shell. Logout moves out of the decks header into `/settings`.
- **Dependencies:** add `lucide-react`.
- **No backend changes:** reuses the existing `list-decks` use case; no new use cases, ports, or adapters.
- **Open item (non-blocking):** the immersive `/decks/[deckId]/study` flow inherits the shell; hiding chrome there is recommended but may be deferred past v1.
