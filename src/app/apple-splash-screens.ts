// iOS launch images. iOS ignores the manifest for splash screens and instead
// reads media-queried <link rel="apple-touch-startup-image"> tags, one per
// device resolution + orientation. This list is the source for those tags
// (rendered in layout.tsx) and mirrors public/splash/splash-links.json — both
// are produced by scripts/generate-pwa-assets.mjs. Regenerate the images and
// paste the refreshed list here when the device set or source mark changes.
export type AppleSplashScreen = { media: string; url: string };

export const appleSplashScreens: AppleSplashScreen[] = [
  { media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-iphone-se-portrait.png" },
  { media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-iphone-se-landscape.png" },
  { media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-iphone-8-portrait.png" },
  { media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-iphone-8-landscape.png" },
  { media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-8-plus-portrait.png" },
  { media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-8-plus-landscape.png" },
  { media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-x-portrait.png" },
  { media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-x-landscape.png" },
  { media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-iphone-xr-portrait.png" },
  { media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-iphone-xr-landscape.png" },
  { media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-xs-max-portrait.png" },
  { media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-xs-max-landscape.png" },
  { media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-12-portrait.png" },
  { media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-12-landscape.png" },
  { media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-12-pro-max-portrait.png" },
  { media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-12-pro-max-landscape.png" },
  { media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-14-pro-portrait.png" },
  { media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-14-pro-landscape.png" },
  { media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)", url: "/splash/splash-iphone-14-pro-max-portrait.png" },
  { media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)", url: "/splash/splash-iphone-14-pro-max-landscape.png" },
  { media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-mini-portrait.png" },
  { media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-mini-landscape.png" },
  { media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-pro-10-portrait.png" },
  { media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-pro-10-landscape.png" },
  { media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-air-portrait.png" },
  { media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-air-landscape.png" },
  { media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-10-portrait.png" },
  { media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-10-landscape.png" },
  { media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-pro-11-portrait.png" },
  { media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-pro-11-landscape.png" },
  { media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)", url: "/splash/splash-ipad-pro-12-portrait.png" },
  { media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)", url: "/splash/splash-ipad-pro-12-landscape.png" },
];
