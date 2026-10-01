// Regenerates every brand asset from the client's logo in public/:
//
//   logo-v2-1.png  transparent (1254×1254) — the source for everything
//                  (v2, 1 Oct 2026: the hybrid-palette refresh — indigo
//                  tile, cyan scooter, turmeric box, coral clouds, moon)
//   logo-v1-*.png  the original logo, kept for reference only
//
// The "mark" is the logo's indigo rounded-square icon (scooter, campus,
// grad cap) — the wordmark and tagline are unreadable at icon sizes, and
// the transparent file's wordmark carries a coloured glow from background
// removal, so only the tile is used as an image. The splash and the share
// card set "College Bites" and the tagline in the app's own fonts.
//
// Outputs:
//   public/brand/mark-v2-1.webp  the tile, 512 px, for in-app logo spots (BrandLogo, splash)
//   public/brand/mark-v2-1.png   the tile, 640 px, for the app icons and the share card
//   public/brand/mark-v2-1-cap.webp / -nocap.webp  the splash's layers: the
//                                graduation cap on its own, and the tile without it
//   src/app/favicon.ico      16/32/48/64 RGBA PNG frames (Next's .ico
//                            decoder rejects non-RGBA frames)
//   src/lib/brand-mark.ts    the tile's colour, sampled (icon backgrounds)
//
// Run after changing the logo:  node scripts/build-brand-assets.mjs
//
// A new logo gets a new MARK name (mark-v3, …): an outside cache once kept
// serving a replaced image by its old URL, so images are never overwritten
// in place. The name is a literal in four files (the PNG reads must stay
// literal so the build bundles them): brand-logo.tsx, splash/config.ts (the
// -nocap / -cap layers), lib/app-icon.tsx, app/opengraph-image.tsx.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const SRC = "public/logo-v2-1.png";
const MARK = "mark-v2-1";
const OUT = "public/brand";

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const px = (x, y) => {
  const i = (y * W + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};

// The tile's bounds: rows and columns where the tile's fill (solid, dark
// blue-indigo pixels — v2's #151049; v1's navy #012141 matches too) covers
// a real stretch — robust against the wordmark below and the faint glow
// specks background removal left around the logo.
const TILE_BOTTOM_LIMIT = Math.round(info.height * 0.66);
const isTileFill = ([r, g, b, a]) => a > 200 && r < 45 && g < 70 && b > 40 && b < 115;
const rows = new Array(info.height).fill(0);
const cols = new Array(W).fill(0);
for (let y = 0; y < TILE_BOTTOM_LIMIT; y++) {
  for (let x = 0; x < W; x++) {
    if (isTileFill(px(x, y))) {
      rows[y]++;
      cols[x]++;
    }
  }
}
const MIN_RUN = 60; // a tile edge row/column has far more navy than a speck
const minY = rows.findIndex((n) => n >= MIN_RUN);
// The tile ends at the first near-empty row below it (the gap above the
// indigo "COLLEGE" letters of the wordmark).
let maxY = minY;
while (maxY + 1 < rows.length && rows[maxY + 1] >= MIN_RUN) maxY++;
const minX = cols.findIndex((n) => n >= MIN_RUN);
const maxX = cols.length - 1 - [...cols].reverse().findIndex((n) => n >= MIN_RUN);
const side = Math.max(maxX - minX + 1, maxY - minY + 1);
const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
console.log("tile box", box, "square side", side);

// Sample the tile's colour just inside its left edge, a third of the way down.
const sample = px(minX + Math.round(box.width * 0.04), minY + Math.round(box.height * 0.3));
const hex = "#" + sample.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
console.log("tile colour", hex);

// Padded to a square first, as its own buffer: sharp keeps only the LAST
// resize() in a pipeline, so chaining "pad to square" and "scale down"
// silently drops the padding (v2's tile is 636×670, not square).
const squareTile = await sharp(SRC)
  .extract(box)
  .resize(side, side, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const tile = () => sharp(squareTile);

await mkdir(OUT, { recursive: true });
await tile().resize(512, 512).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${MARK}.webp`);
await tile().resize(640, 640).png({ compressionLevel: 9 }).toFile(`${OUT}/${MARK}.png`);

// ---- Splash layers: the graduation cap, lifted off the tile ------------------
// The startup splash drops the cap into the logo, so it needs the cap on its
// own (transparent) and the tile without it. The cap and tassel are traced on
// logo v2's art as fractions of the tile — retrace them if the logo changes.
// Inside the traced area the whole tile is painted back to its own colour
// (the ground there is flat; painting only cap-coloured pixels left ghost
// edges); the cap layer keeps only what isn't tile colour, softly.
const CAP_POLY = [
  [0.136, 0.302], [0.281, 0.145], [0.453, 0.063], [0.463, 0.081],
  [0.409, 0.172], [0.372, 0.259], [0.263, 0.305], [0.195, 0.313],
];
const TASSEL_BOX = [0.125, 0.281, 0.2, 0.441]; // x0, y0, x1, y1
const LAYER = 640;
const tileRaw = await tile().resize(LAYER, LAYER).ensureAlpha().raw().toBuffer();
const pts = (poly) => poly.map(([x, y]) => `${x * LAYER},${y * LAYER}`).join(" ");
const [tx0, ty0, tx1, ty1] = TASSEL_BOX.map((v) => v * LAYER);
const capMask = await sharp(
  Buffer.from(
    `<svg width="${LAYER}" height="${LAYER}" xmlns="http://www.w3.org/2000/svg">` +
      `<polygon points="${pts(CAP_POLY)}" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` +
      `<rect x="${tx0}" y="${ty0}" width="${tx1 - tx0}" height="${ty1 - ty0}" fill="#fff"/></svg>`,
  ),
)
  .extractChannel(0)
  .raw()
  .toBuffer();
const ink = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const capRaw = Buffer.alloc(LAYER * LAYER * 4);
const noCapRaw = Buffer.from(tileRaw);
let cx0 = LAYER, cy0 = LAYER, cx1 = 0, cy1 = 0;
for (let i = 0; i < LAYER * LAYER; i++) {
  if (capMask[i] === 0) continue;
  const m = capMask[i] / 255;
  const [r, g, b] = [tileRaw[i * 4], tileRaw[i * 4 + 1], tileRaw[i * 4 + 2]];
  for (let c = 0; c < 3; c++) noCapRaw[i * 4 + c] = Math.round(ink[c] * m + tileRaw[i * 4 + c] * (1 - m));
  if (capMask[i] < 128) continue;
  const a = Math.max(0, Math.min(1, (Math.hypot(r - ink[0], g - ink[1], b - ink[2]) - 25) / 70));
  if (a <= 0) continue;
  capRaw.set([r, g, b, Math.round(a * 255)], i * 4);
  const x = i % LAYER, y = (i / LAYER) | 0;
  cx0 = Math.min(cx0, x); cx1 = Math.max(cx1, x); cy0 = Math.min(cy0, y); cy1 = Math.max(cy1, y);
}
const raw = { raw: { width: LAYER, height: LAYER, channels: 4 } };
await sharp(noCapRaw, raw).resize(512, 512).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${MARK}-nocap.webp`);
const capBox = { left: cx0, top: cy0, width: cx1 - cx0 + 1, height: cy1 - cy0 + 1 };
await sharp(capRaw, raw).extract(capBox).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${MARK}-cap.webp`);
const frac = (v) => +(v / LAYER).toFixed(4);
const cap = { x: frac(capBox.left), y: frac(capBox.top), w: frac(capBox.width), h: frac(capBox.height) };
console.log("cap", cap);

await writeFile(
  "src/lib/brand-mark.ts",
  `// Generated by scripts/build-brand-assets.mjs — don't edit by hand.
/** The colour of the logo's icon tile (public/brand/${MARK}.*), sampled from the art. */
export const MARK_TILE = "${hex}";
/** Where the graduation cap sits in the tile, as fractions of it (the splash's
 *  ${MARK}-cap.webp layer drops into ${MARK}-nocap.webp here). */
export const MARK_CAP = { x: ${cap.x}, y: ${cap.y}, w: ${cap.w}, h: ${cap.h} } as const;
`,
);

// ---- favicon.ico: the tile itself (it already has rounded corners) ----------
const tilePng = squareTile;
async function faviconFrame(size) {
  return sharp(tilePng).resize(size, size).png().toBuffer();
}
const sizes = [16, 32, 48, 64];
const frames = await Promise.all(sizes.map(faviconFrame));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size === 256 ? 0 : size, e);
  header.writeUInt8(size === 256 ? 0 : size, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(frames[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += frames[i].length;
});
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...frames]));
console.log("done");
