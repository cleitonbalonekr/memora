## Why

Memora is a mobile-first study app, but today it is a plain web page: there is no web app manifest, no app icons, and no PWA metadata (`public/` holds only template SVGs). A user on a phone cannot install it to the home screen, gets browser chrome instead of an app-like fullscreen view, and sees a generic icon and a blank launch. The PRD calls for shipping as an installable PWA so users can study on their phones with an app-like experience. This change delivers that installable baseline.

Scope is deliberately **Level 1: installable shell only** — app icon, name, fullscreen (`standalone`) launch, and a branded splash on both Android and iOS. **No service worker and no offline behavior** are in scope; the app still requires a network connection and the existing server-rendered, cookie-authed data path is untouched. Offline study is a deliberately deferred follow-up.

## What Changes

- Add a web app **manifest** (`src/app/manifest.ts`, Next 16 native) declaring `name`, `short_name`, `description`, `start_url:"/"`, `scope:"/"`, `display:"standalone"`, `theme_color`, `background_color`, and the icon set. This makes the app installable and gives Android an automatic, branded splash.
- Add the **icon set** under `public/icons/`: 192×192, 512×512, and a 512×512 maskable icon, plus a 180×180 `apple-touch-icon`. Generated from a single source mark kept in the repo so all sizes can be re-derived when final branding lands.
- Add **iOS branded splash screens**: ~15 `apple-touch-startup-image` PNGs under `public/splash/` (one per supported device resolution/orientation) composited as the mark on the `background_color` canvas, wired via media-queried `<link>` tags. iOS ignores the manifest for splash, so this is required to get a branded launch on iPhone/iPad.
- Update **`src/app/layout.tsx`** metadata: add the `viewport` export (`themeColor`), `metadata.appleWebApp` (`capable`, `statusBarStyle`, `title`), and the `apple-touch-startup-image` link tags. The manifest is auto-linked by Next from `manifest.ts`.
- Choose brand colors from the existing palette in `globals.css`: `theme_color` = `--color-primary` (`#3525cd`), `background_color` = `--color-surface` (`#f7f9fb`), so the installed chrome and splash match the app.

## Capabilities

### New Capabilities
- `pwa-installability`: the app is installable to a phone/desktop home screen via a web app manifest, launches in a standalone (fullscreen, no browser chrome) window from a branded app icon, and shows a branded splash screen on both Android (manifest-driven) and iOS (`apple-touch-startup-image`).

### Modified Capabilities
<!-- None. This is additive web-layer + static-asset work and changes no existing documented capability. -->

## Impact

- **New files:** `src/app/manifest.ts`; `public/icons/` (192, 512, 512-maskable, apple-touch-icon 180) and the source mark; `public/splash/` (iOS startup images).
- **Modified files:** `src/app/layout.tsx` (add `viewport` + `appleWebApp` metadata + `apple-touch-startup-image` link tags).
- **No dependencies added:** uses Next 16 native `manifest.ts` / `viewport` / `appleWebApp` metadata. (An image-generation step is a build-time/dev concern, not a runtime dependency.)
- **No backend, no use case, no adapter, no data-path changes.** No service worker; no offline. The app still requires network.
- **Source-art note:** final branding was referenced as a Google Stitch screen, which is not accessible from the repo. Icons/splash ship from a **placeholder mark** now; replacing `public/icons/source/*` with the real export and re-running the generation step refreshes all sizes without touching code.
- **Deferred (out of scope):** service worker, offline study, background sync, install prompts/UI.
