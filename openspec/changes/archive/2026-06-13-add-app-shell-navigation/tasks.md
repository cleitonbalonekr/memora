## 1. Setup

- [x] 1.1 Add `lucide-react` to `package.json` and install
- [x] 1.2 Create `src/shared/ui/nav-config.ts`: a typed array of nav items (label, href, lucide icon, and which surface shows it — sidebar/bottom/both), encoding Dashboard, Library, Analytics (sidebar-only), Settings, and Create (bottom-nav item + sidebar "Create New Deck" action)

## 2. Shell components (src/shared/ui/)

- [x] 2.1 Create `top-bar.tsx`: sticky top bar — "Memora" wordmark on mobile, spacer on desktop, avatar linking to `/settings` (server component)
- [x] 2.2 Create `side-nav.tsx`: fixed left sidebar (desktop, `hidden md:flex`), client component using `usePathname()` for active state with `aria-current="page"`, "Create New Deck" button pinned at the bottom; items from nav-config
- [x] 2.3 Create `bottom-nav.tsx`: fixed bottom nav (mobile, `md:hidden`), client component using `usePathname()` for active state with `aria-current="page"`; items from nav-config
- [x] 2.4 Create `app-shell.tsx`: composes sidebar + top bar + bottom nav + a scrollable `<main>` with the centered content container and padding the pages previously owned

## 3. Wire the shell into the layout

- [x] 3.1 Update `src/app/(app)/layout.tsx` to wrap `children` in `AppShell` (keep the existing auth gate)
- [x] 3.2 Update `src/app/page.tsx` to redirect authenticated users to `/dashboard` (unauthenticated still to `/log-in`)

## 4. New screens

- [x] 4.1 Create `src/app/(app)/dashboard/page.tsx`: welcome banner, stats grid (Current Streak + Studied Today as placeholders with a `TODO` marking them un-backed), and a Recent Decks section using the existing `list-decks` use case (with an empty state for no decks)
- [x] 4.2 Create `src/app/(app)/analytics/page.tsx`: minimal "Coming soon" placeholder rendered in the shell
- [x] 4.3 Create `src/app/(app)/settings/page.tsx`: minimal real Settings page that hosts the relocated Logout action (reuse `LogoutButton` / `logOutAction`), plus placeholder "coming soon" content

## 5. Refactor existing pages into the shell

- [x] 5.1 `decks/page.tsx`: remove its `<main>`/background/`max-w` wrapper and the header `LogoutButton`; render content into the shell; relabel as "Library"
- [x] 5.2 `decks/[deckId]/page.tsx`: shed the page-level shell wrapper, keep contextual content (title, actions, card list)
- [x] 5.3 `decks/new/page.tsx` and `decks/[deckId]/edit/page.tsx`: shed page-level shell wrappers
- [x] 5.4 `decks/[deckId]/generate/page.tsx`: shed page-level shell wrapper
- [x] 5.5 `decks/[deckId]/cards/new/page.tsx` and `decks/[deckId]/cards/[cardId]/edit/page.tsx`: shed page-level shell wrappers
- [x] 5.6 `decks/[deckId]/study/page.tsx`: render into the shell (chrome visible in v1; hiding chrome for the immersive flow is a tracked follow-up)

## 6. Verification

- [x] 6.1 `npm run lint` and `npm run build` pass; no boundary-rule violations
- [x] 6.2 Manually verify desktop (md+): sidebar visible, content offset, no bottom nav, active item highlighted with `aria-current`
- [x] 6.3 Manually verify mobile (<md): bottom nav visible, sidebar hidden, top bar shows wordmark, active item highlighted
- [x] 6.4 Verify navigation reaches Dashboard, Library, Analytics (coming soon), Settings, and Create; Logout works from Settings and is gone from the deck header
