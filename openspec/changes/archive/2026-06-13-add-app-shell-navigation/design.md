## Context

Authenticated pages under `src/app/(app)/` currently have no shared chrome: `(app)/layout.tsx` only resolves the current user and redirects unauthenticated visitors, returning `children` raw. Each page builds its own `<main className="min-h-dvh bg-surface ...">` plus a centered `max-w-[600px]` container and a bespoke header. Logout is a button inside the deck list header. `globals.css` already ports the full `dashboard_mobile` design token set (colors, type scale utilities like `text-display-lg`/`text-headline-md`, spacing `xs..xl`, `shadow-level1/2`), so the visual language exists — only structural chrome and the navigation IA are missing. The stack is Next.js 16 App Router, React 19, Tailwind v4 (`@import "tailwindcss"` + `@theme`). No icon library is installed; the design uses Material Symbols via a Google Fonts CDN link. The app is intended to ship as an installable PWA.

This design follows `docs/architecture-and-rules.md`: this is web-layer work only. No new use cases, ports, or adapters — the dashboard reuses the existing `list-decks` use case.

## Goals / Non-Goals

**Goals:**
- One global, responsive app shell rendered in `(app)/layout.tsx`, wrapping every authenticated page; auth pages stay chrome-free.
- A single nav-config that drives both the desktop sidebar and the mobile bottom nav.
- IA aligned with the design: Dashboard / Library / Analytics / Settings, with the design's per-breakpoint differences preserved.
- New screens: `/dashboard` (real Recent Decks + placeholder stats), `/analytics` (coming soon), `/settings` (hosts Logout).
- Existing pages refactored to render into the shell; Logout relocated out of the deck header.

**Non-Goals:**
- Tracking streak / studied-today metrics (rendered as marked placeholders for now).
- Building Analytics content (placeholder only) or full Settings preferences (only Logout is real).
- Functional search / notifications / help controls from the design's top bar (decorative or omitted in v1).
- Changing any backend use case, port, adapter, or the data model.

## Decisions

### Shell lives in `(app)/layout.tsx`, components in `src/shared/ui/`
The route-group split already separates authenticated (`(app)/`) from auth (`(auth)/`) pages, so wrapping `(app)/layout.tsx` gives chrome exactly where wanted and keeps auth pages (which use `auth-shell.tsx`) untouched. Chrome components go in `src/shared/ui/` alongside existing shared UI (`form-field.tsx`, `text-area-field.tsx`). Files: `app-shell.tsx`, `top-bar.tsx`, `side-nav.tsx`, `bottom-nav.tsx`, and a nav-config module (e.g. `nav-config.ts`). Note `src/shared/navigation/` already exists but holds path-safety helpers (`next-path.ts`), not UI — UI chrome stays under `src/shared/ui/` to avoid conflating the two.
- *Alternative considered:* a nested layout per section — rejected as overkill; one shell covers all authenticated routes.

### Single nav-config as source of truth
One typed array of nav items (label, href, icon, and a flag/grouping for which breakpoint surface shows it) is consumed by both `side-nav` and `bottom-nav`. This is the DRY seam that prevents the two navs from drifting. The desktop sidebar shows Dashboard/Library/Analytics/Settings + a "Create New Deck" button; the mobile bottom nav shows Dashboard/Library/Create/Settings. The per-breakpoint difference (Analytics desktop-only; Create promoted on mobile) is encoded in the config, not duplicated in markup.
- *Alternative considered:* two independent nav component definitions — rejected; guaranteed to drift.

### Client components only where interaction requires it
`side-nav` and `bottom-nav` need `usePathname()` for active-state, so they are client components and set `aria-current="page"` on the active item. `app-shell` and `top-bar` can stay server components (top bar's avatar is a plain link to `/settings`; no dropdown, since Logout lives in Settings). This keeps the client bundle minimal.

### Icons via `lucide-react`, not Material Symbols CDN
The design loads Material Symbols from Google's CDN. For an installable, offline-capable PWA a CDN icon font is a liability (offline failure, FOUC, extra network). `lucide-react` ships tree-shakeable SVGs, works offline, and is close enough visually. Glyph mapping: `dashboard`→`LayoutDashboard`, `style`→`Layers`, `leaderboard`→`BarChart3`, `settings`→`Settings`, `add_circle`→`PlusCircle`, `local_fire_department`→`Flame`, `check_circle`→`CheckCircle2`, `schedule`→`Clock`.
- *Alternatives considered:* self-hosted Material Symbols (faithful but ships the whole icon font); CDN as-is (breaks offline) — both rejected for a PWA.

### Dashboard stats are marked placeholders; Recent Decks is real
Streak and Studied-Today are not tracked anywhere, so they render as hardcoded values with a `TODO` comment marking them un-backed, avoiding a false impression of real data. Recent Decks pulls from the existing `list-decks` use case (already user-scoped server-side), keeping ownership enforcement intact and adding no backend.

### Landing redirect → `/dashboard`
`src/app/page.tsx` redirects authenticated users to `/dashboard` (was `/decks`); unauthenticated users still go to `/log-in`. The deck list keeps its `/decks` route but is relabeled "Library" in the nav.

### Per-page refactor
Each existing `(app)` page drops its `<main>`/background/`max-w` wrapper; the shell owns `<main>`, the centered content container, scroll, and padding. Pages render only their content (sections/headers). The orphaned `LogoutButton` is removed from the deck header and relocated to `/settings`.

## Risks / Trade-offs

- **Placeholder stats mistaken for real data** → mark them un-backed in code (`TODO`) and keep values obviously static; track as a follow-up to wire real metrics.
- **Per-page refactor touches ~6 pages and could regress layout** → refactor is mechanical (remove wrapper, keep inner content); verify each page renders correctly inside the shell at mobile and desktop widths.
- **Lucide icons differ visually from Material Symbols** → accepted; chosen mapping keeps intent recognizable, and offline support outweighs pixel-exactness for a PWA.
- **Study session inherits chrome** → immersive `/decks/[deckId]/study` shows nav by default; mitigation deferred (see Open Questions) — acceptable for v1.
- **Top-bar search/notifications/help are non-functional in the design** → omit or render decoratively in v1 to avoid implying features that do not exist.

## Open Questions

- Should the immersive study flow (`/decks/[deckId]/study`) hide the shell chrome? Recommended (via a nested layout or a route-aware flag), but acceptable to ship chrome v1 and refine later.
- Do we keep the top bar's search/notifications/help as decorative placeholders, or omit them entirely in v1? Leaning toward omit until backed by real behavior.
