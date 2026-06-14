## 1. Source art & icons

- [x] 1.1 Add a placeholder source mark at `public/icons/source/memora-mark.svg` (the "M"/wordmark on `--color-primary` `#3525cd`); this is the single source all sizes derive from and is the only file to swap when real branding lands
- [x] 1.2 Generate `public/icons/icon-192.png` (192×192) and `public/icons/icon-512.png` (512×512) from the source mark
- [x] 1.3 Generate `public/icons/icon-512-maskable.png` (512×512, mark inside the adaptive-icon safe zone, `background_color` fill)
- [x] 1.4 Generate `public/icons/apple-touch-icon.png` (180×180, no transparency, `background_color` fill)

## 2. Web app manifest

- [x] 2.1 Create `src/app/manifest.ts` returning a `MetadataRoute.Manifest` with `name:"Memora"`, `short_name:"Memora"`, `description`, `start_url:"/"`, `scope:"/"`, `display:"standalone"`, `theme_color:"#3525cd"`, `background_color:"#f7f9fb"`
- [x] 2.2 Register the icons in the manifest: 192 (`any`), 512 (`any`), 512-maskable (`maskable`) with correct `sizes`/`type`/`purpose`

## 3. iOS splash screens

- [x] 3.1 Generate `apple-touch-startup-image` PNGs under `public/splash/` for the supported iPhone/iPad resolutions (portrait + landscape), mark centered on a `#f7f9fb` canvas — derive all sizes from the source mark
- [x] 3.2 Build the matching `<link rel="apple-touch-startup-image" media="...">` tags (device-width/height + `-webkit-device-pixel-ratio` + orientation media queries) pointing at each `public/splash/` image

## 4. Layout metadata (`src/app/layout.tsx`)

- [x] 4.1 Add the `viewport` export with `themeColor:"#3525cd"`
- [x] 4.2 Add `metadata.appleWebApp`: `{ capable:true, title:"Memora", statusBarStyle:"default" }` (default suits the light surface)
- [x] 4.3 Add the `apple-touch-startup-image` link tags from 3.2 (via `metadata.other` or explicit `<link>`s in the head) and the `apple-touch-icon` link
- [x] 4.4 Confirm Next auto-links the manifest from `manifest.ts` (no manual `<link rel="manifest">` needed)

## 5. Verification

- [x] 5.1 `npm run lint` and `npm run build` pass; manifest is emitted at `/manifest.webmanifest`
- [x] 5.2 Chrome DevTools → Application → Manifest shows name, icons, theme/background colors with no errors, and "Installability" reports the app as installable
- [x] 5.3 Lighthouse PWA / installability check passes (installable, standalone, has maskable icon)
- [x] 5.4 Install on an Android device/emulator: branded icon on home screen, standalone launch (no browser chrome), manifest-driven splash on startup
- [x] 5.5 Install on iOS (Safari → Add to Home Screen): branded icon, standalone launch with correct status-bar style, branded `apple-touch-startup-image` splash on a supported device
- [x] 5.6 Confirm no service worker is registered and no offline behavior was introduced (network-off load fails as before — out of scope)
