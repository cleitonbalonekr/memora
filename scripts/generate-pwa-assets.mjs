// Regenerates every PWA icon and iOS splash image from the single source mark.
// Run with: node scripts/generate-pwa-assets.mjs
// All output is derived art — swap public/icons/source/memora-mark.png with the
// final branding and re-run this script to refresh every size. No code changes.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "public/icons/source/memora-mark.png");
const ICONS_DIR = join(ROOT, "public/icons");
const SPLASH_DIR = join(ROOT, "public/splash");

// Brand palette (mirrors globals.css: --color-primary, --color-surface).
const BACKGROUND_COLOR = "#f7f9fb";

// iOS launch devices: CSS points (portrait) + device-pixel-ratio. Pixel
// dimensions are derived (points * ratio). One splash per device per orientation.
const DEVICES = [
  { name: "iphone-se", w: 320, h: 568, ratio: 2 },
  { name: "iphone-8", w: 375, h: 667, ratio: 2 },
  { name: "iphone-8-plus", w: 414, h: 736, ratio: 3 },
  { name: "iphone-x", w: 375, h: 812, ratio: 3 },
  { name: "iphone-xr", w: 414, h: 896, ratio: 2 },
  { name: "iphone-xs-max", w: 414, h: 896, ratio: 3 },
  { name: "iphone-12", w: 390, h: 844, ratio: 3 },
  { name: "iphone-12-pro-max", w: 428, h: 926, ratio: 3 },
  { name: "iphone-14-pro", w: 393, h: 852, ratio: 3 },
  { name: "iphone-14-pro-max", w: 430, h: 932, ratio: 3 },
  { name: "ipad-mini", w: 768, h: 1024, ratio: 2 },
  { name: "ipad-pro-10", w: 834, h: 1112, ratio: 2 },
  { name: "ipad-air", w: 820, h: 1180, ratio: 2 },
  { name: "ipad-10", w: 810, h: 1080, ratio: 2 },
  { name: "ipad-pro-11", w: 834, h: 1194, ratio: 2 },
  { name: "ipad-pro-12", w: 1024, h: 1366, ratio: 2 },
];

async function renderMark(source, size) {
  return sharp(source).resize(size, size).png().toBuffer();
}

// A flat background_color canvas with the mark centered at a fraction of the
// shorter side. The source logo already carries its own padding, so fractions
// here are tuned against the canvas, not the visible card.
async function composeCanvas(source, width, height, markFraction) {
  const markSize = Math.round(Math.min(width, height) * markFraction);
  const mark = await renderMark(source, markSize);
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([{ input: mark }]) // centered by default
    .png()
    .toBuffer();
}

async function main() {
  const source = await readFile(SOURCE);
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(SPLASH_DIR, { recursive: true });

  // Icons (purpose: "any") — direct resize of the source logo, transparency kept.
  await writeFile(join(ICONS_DIR, "icon-192.png"), await renderMark(source, 192));
  await writeFile(join(ICONS_DIR, "icon-512.png"), await renderMark(source, 512));

  // Maskable icon — logo on a background_color canvas so any adaptive mask crops
  // only flat color. The logo's own padding keeps the card well inside the
  // 80% safe zone even at near-full scale.
  await writeFile(
    join(ICONS_DIR, "icon-512-maskable.png"),
    await composeCanvas(source, 512, 512, 0.92),
  );

  // Apple touch icon — 180x180, opaque (no alpha), background_color fill.
  await writeFile(
    join(ICONS_DIR, "apple-touch-icon.png"),
    await sharp(await composeCanvas(source, 180, 180, 0.92))
      .flatten({ background: BACKGROUND_COLOR })
      .png()
      .toBuffer(),
  );

  // iOS splash screens — mark centered on a background_color canvas, per device
  // and orientation.
  const links = [];
  for (const d of DEVICES) {
    const pw = d.w * d.ratio;
    const ph = d.h * d.ratio;
    for (const orientation of ["portrait", "landscape"]) {
      const isPortrait = orientation === "portrait";
      const width = isPortrait ? pw : ph;
      const height = isPortrait ? ph : pw;
      const file = `splash-${d.name}-${orientation}.png`;
      await writeFile(
        join(SPLASH_DIR, file),
        await sharp(await composeCanvas(source, width, height, 0.34))
          .flatten({ background: BACKGROUND_COLOR })
          .png()
          .toBuffer(),
      );
      const media =
        `(device-width: ${d.w}px) and (device-height: ${d.h}px) ` +
        `and (-webkit-device-pixel-ratio: ${d.ratio}) and (orientation: ${orientation})`;
      links.push({ media, url: `/splash/${file}` });
    }
  }

  // Emit the link descriptors so layout.tsx can stay in sync with this device list.
  await writeFile(
    join(SPLASH_DIR, "splash-links.json"),
    JSON.stringify(links, null, 2) + "\n",
  );

  console.log(
    `Generated 4 icons + ${links.length} splash images. Link descriptors written to public/splash/splash-links.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
