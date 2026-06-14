import type { MetadataRoute } from "next";

// Web app manifest (Next 16 native). Auto-linked into <head> as
// /manifest.webmanifest — no manual <link rel="manifest"> needed.
// Colors mirror globals.css: theme_color = --color-primary, background_color = --color-surface.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Memora",
    short_name: "Memora",
    description:
      "Create and study double-sided active recall cards with AI assistance.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#3525cd",
    background_color: "#f7f9fb",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
