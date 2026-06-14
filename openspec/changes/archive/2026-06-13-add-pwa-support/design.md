## Context

Memora must be installable on phones for an app-like study experience (PRD). The app is Next.js 16 App Router, server-rendered, with Supabase cookie auth. This change adds only the installable PWA baseline; it intentionally excludes any service worker or offline behavior, so the existing server-first data path is unaffected.

## Decisions

### No service worker, no offline (Level 1 only)
We add a manifest + icons + splash + install metadata, and nothing that intercepts network. Rationale: the request was explicitly "installable app with icon and splashscreen, no offline behavior for now." Offline would require shipping card data to the client (IndexedDB), a client-side study runner, and a sync-back path — a parallel data layer that partly bypasses the server-first use-case architecture (ADR-001/003). That is a separate, larger change and is deferred. Keeping Level 1 free of a service worker also avoids the classic SW cache-staleness and update-prompt pitfalls for zero current benefit.

### Native Next 16 metadata, no library
Use `src/app/manifest.ts`, the `viewport` export, and `metadata.appleWebApp` rather than `next-pwa`/`@serwist/next`. Those libraries exist primarily to manage a service worker, which we are not shipping. This matches the repo's YAGNI stance (architecture-and-rules.md): add no dependency that does not earn its place.

### Branded splash on both platforms — the asymmetry
Android composes the splash automatically from the manifest (`name` + icon + `background_color`); nothing else is needed. iOS **ignores the manifest** for the launch image and requires explicit `<link rel="apple-touch-startup-image" media="...">` tags, one per device resolution and orientation (~15 images). To get a branded launch on iPhone/iPad we must generate that set. This is the bulk of the change's surface area but is pure static assets.

### Single source mark, derived sizes
All icons and splash images derive from one source mark committed at `public/icons/source/`. Sizes are generated output, not hand-authored, so swapping in real branding later is a re-run, not a re-draw. The current mark is a placeholder (a wordmark/"M" on brand color) because the referenced final logo (a Google Stitch screen) is not reachable from the repo.

### Colors from the existing palette
`theme_color` = `--color-primary` (`#3525cd`); `background_color` = `--color-surface` (`#f7f9fb`). Pulling from `globals.css` keeps installed chrome and the splash visually consistent with the running app. `apple-mobile-web-app-status-bar-style` is set so the iOS status bar reads correctly against the light surface.

## Risks / Trade-offs

- **iOS splash set is maintenance-prone.** Apple device resolutions change over time and unmatched media queries fall back to a blank `background_color` screen. Mitigation: derive from the source mark via a repeatable generation step and accept graceful fallback for any unlisted device.
- **Placeholder branding ships first.** Acceptable: the swap is asset-only and code-free. Tracked in tasks.
- **No install prompt UX.** We rely on the browser's native "Add to Home Screen." A custom `beforeinstallprompt` flow is out of scope and can be added later.

## Open Questions

- Final logo export from the Stitch reference — who provides it and when? (Non-blocking; placeholder ships now.)
- Confirm `short_name` (≤12 chars for home-screen label) — proposed `"Memora"`.
