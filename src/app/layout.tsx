import type { Metadata, Viewport } from "next";
import "./globals.css";
import { appleSplashScreens } from "./apple-splash-screens";

export const metadata: Metadata = {
  title: "Memora",
  description:
    "Create and study double-sided active recall cards with AI assistance",
  // Next auto-links the manifest from manifest.ts (/manifest.webmanifest) —
  // no manual <link rel="manifest"> needed.
  appleWebApp: {
    capable: true,
    title: "Memora",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3525cd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* iOS launch images: media-queried per device/orientation. iOS ignores
            the manifest for splash, so these are required for a branded launch.
            Unmatched devices fall back to background_color. */}
        {appleSplashScreens.map((screen) => (
          <link
            key={screen.url}
            rel="apple-touch-startup-image"
            media={screen.media}
            href={screen.url}
          />
        ))}
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        {children}
      </body>
    </html>
  );
}
