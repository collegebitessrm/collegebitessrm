// Regenerates every brand asset from the two source logos in public/:
//
//   mutebites-logo-v2-2.png  transparent — cut into splash layers + the mark
//   mutebites-logo-v2-1.png  on its own background — kept as the reference
//
// Outputs:
//   public/brand/splash/*.webp            layers for the startup splash
//                                         (body, legs, tray, shoes, lid, ...)
//   src/components/splash/layers.ts       their boxes (generated)
//   public/brand/mark.webp                mascot mark for in-app logo tiles
//   public/brand/mark.png                 same, PNG, for the generated app icons
//   src/app/favicon.ico                   16/32/48/64 RGBA PNG frames
//
// Run after changing the logo:  node scripts/build-brand-assets.mjs
// The layer regions below are hand-measured against the 1254×1254 source;
// a redrawn logo needs them re-measured (every layer at rest composites
// back to exactly the source image, so a bad cut shows as a gap/overlap
// only while the layers move).

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const SRC = "public/mutebites-logo-v2-2.png";
const OUT = "public/brand";
const IVORY = "#f5eae1";
/** Splash layers are stored at this fraction of the source (still ~2.5× a phone-sized splash). */
const LAYER_SCALE = 0.75;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// Background removal left the art at alpha ~250 and faint specks in the
// empty area — snap near-opaque to opaque and drop near-invisible noise.
for (let i = 3; i < data.length; i += 4) {
  if (data[i] >= 236) data[i] = 255;
  else if (data[i] < 12) data[i] = 0;
}

// ---- Regions (source pixels) ----------------------------------------------
// Left edge of the bag's back panel, used to cut the speed trails off it.
const bagEdge = (y) => 490 - ((y - 300) * 80) / 300;
// Left edge of the right shin, which dips into the swoosh's box.
const shinEdge = (y) => 750 + (y - 765) * 0.66;
// Bottom of the cloche dome — follows the plate rim's curve.
const lidBottom = (x) => 545 + ((x - 950) / 135) ** 2 * 14;
// Underside of the delivery bag; the legs hang below it.
const bagBottom = (x) => 624 + ((x - 410) * 28) / 370;

const REGIONS = {
  steam: (x, y) =>
    (x >= 900 && x <= 1075 && y >= 250 && y < 422) || (x >= 976 && x <= 1075 && y >= 422 && y < 442),
  lid: (x, y) => x >= 815 && x <= 1090 && y >= 418 && y <= lidBottom(x),
  trails: (x, y) => y >= 370 && y <= 600 && x >= 200 && x < bagEdge(y) - 6,
  swoosh: (x, y) => x >= 370 && x < Math.min(shinEdge(y), 760) && y >= (x < 490 ? 790 : 765) && y < 866,
  wordmark: (x, y) => y >= 866 && y < 1116,
  tagline: (x, y) => y >= 1116 && y < 1180,
  // The arm and the plate it carries (the lid and steam ride on it). The
  // arm ends at y 657; below that the front thigh's edge starts.
  tray: (x, y) => x >= 786 && y >= 540 && y < 670,
  // Both legs and shoes, everything under the bag.
  legs: (x, y) => y > bagBottom(x) + 2 && y < 866 && (x < 786 || y >= 670),
};
const ORDER = ["steam", "lid", "trails", "swoosh", "wordmark", "tagline", "tray", "legs"];
const regionOf = (x, y) => {
  for (const name of ORDER) if (REGIONS[name](x, y)) return name;
  return y >= 140 && y < 866 ? "body" : null;
};

// The two shoes, cut back out of the legs as their own images: the splash
// re-draws the legs as vector tubes with real hip/knee/ankle joints and
// hangs these on the ankles, so they're ellipses fitted to the art.
const inEllipse = (cx, cy, a, b, deg) => (x, y) => {
  const t = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  const u = dx * Math.cos(t) + dy * Math.sin(t);
  const v = -dx * Math.sin(t) + dy * Math.cos(t);
  return (u / a) ** 2 + (v / b) ** 2 <= 1;
};
const SHOES = {
  backShoe: inEllipse(424, 716, 84, 45, -46.6),
  frontShoe: inEllipse(851, 776, 86, 45, -48.8),
};

// Seam fillers. Where a cut runs through solid paint, the layer drawn
// *underneath* also keeps a few pixels past the cut (hidden by the layer on
// top). Without this, each layer's own edge anti-aliasing leaves a
// hairline of background along the join when the logo is at rest.
// [layer that gets the extra pixels, layer they're copied from, test]
const UNDERLAPS = [
  ["legs", "body", (x, y) => y > bagBottom(x) - 8 && (x < 786 || y >= 670)],
  ["tray", "body", (x, y) => x >= 772 && y >= 540 && y < 670],
  ["trails", "body", (x, y) => y >= 370 && y <= 600 && x >= 200 && x < bagEdge(y) + 6],
  ["tray", "lid", (x, y) => y > lidBottom(x) - 6],
];

// ---- Split -----------------------------------------------------------------
const newLayer = () => ({ buf: Buffer.alloc(W * H * 4), minX: W, minY: H, maxX: -1, maxY: -1 });
const put = (l, i, x, y) => {
  data.copy(l.buf, i, i, i + 4);
  if (x < l.minX) l.minX = x;
  if (y < l.minY) l.minY = y;
  if (x > l.maxX) l.maxX = x;
  if (y > l.maxY) l.maxY = y;
};
const layers = {};
for (const name of [...ORDER, "body"]) layers[name] = newLayer();
const shoes = { backShoe: newLayer(), frontShoe: newLayer() };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (data[i + 3] === 0) continue;
    const name = regionOf(x, y);
    if (!name) continue;
    put(layers[name], i, x, y);
    if (name === "legs") {
      for (const [shoe, test] of Object.entries(SHOES)) if (test(x, y)) put(shoes[shoe], i, x, y);
    }
    for (const [under, from, test] of UNDERLAPS) if (name === from && test(x, y)) put(layers[under], i, x, y);
  }
}
const all = { ...layers, ...shoes };

// Stage = union of every layer's box; positions are stored relative to it.
const stage = Object.values(layers).reduce(
  (s, l) => ({
    minX: Math.min(s.minX, l.minX),
    minY: Math.min(s.minY, l.minY),
    maxX: Math.max(s.maxX, l.maxX),
    maxY: Math.max(s.maxY, l.maxY),
  }),
  { minX: W, minY: H, maxX: 0, maxY: 0 },
);
const stageW = stage.maxX - stage.minX + 1;
const stageH = stage.maxY - stage.minY + 1;

await mkdir(`${OUT}/splash`, { recursive: true });
// Boxes in source pixels, relative to the stage's top-left. The splash's
// SVG leg rig uses the same coordinates (viewBox = stage), so its joints
// can be measured straight off the source image.
const boxes = {};
for (const [name, l] of Object.entries(all)) {
  const width = l.maxX - l.minX + 1;
  const height = l.maxY - l.minY + 1;
  await sharp(l.buf, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: l.minX, top: l.minY, width, height })
    .resize(Math.round(width * LAYER_SCALE))
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(`${OUT}/splash/${name}.webp`);
  boxes[name] = { src: `/brand/splash/${name}.webp`, x: l.minX, y: l.minY, w: width, h: height };
}

// ---- Mark: the mascot group (no wordmark/tagline/swoosh) --------------------
const MARK_LAYERS = ["body", "legs", "tray", "trails", "lid", "steam"];
const mark = Buffer.alloc(W * H * 4);
const markBox = { minX: W, minY: H, maxX: 0, maxY: 0 };
for (const name of MARK_LAYERS) {
  const l = layers[name];
  for (let i = 0; i < l.buf.length; i += 4) {
    if (l.buf[i + 3] === 0) continue;
    l.buf.copy(mark, i, i, i + 4);
  }
  markBox.minX = Math.min(markBox.minX, l.minX);
  markBox.minY = Math.min(markBox.minY, l.minY);
  markBox.maxX = Math.max(markBox.maxX, l.maxX);
  markBox.maxY = Math.max(markBox.maxY, l.maxY);
}
const markW = markBox.maxX - markBox.minX + 1;
const markH = markBox.maxY - markBox.minY + 1;
const markImg = () =>
  sharp(mark, { raw: { width: W, height: H, channels: 4 } }).extract({
    left: markBox.minX,
    top: markBox.minY,
    width: markW,
    height: markH,
  });

await writeFile(
  "src/components/splash/layers.ts",
  `// Generated by scripts/build-brand-assets.mjs — don't edit by hand.
// Every splash layer's box in source-logo pixels (1254×1254 art); the
// stage is the logo's visible bounds, the mark is the mascot group that
// BrandLogo shows (public/brand/mark.webp) — the splash lands on it.

export const STAGE = ${JSON.stringify({ x: stage.minX, y: stage.minY, w: stageW, h: stageH })};

export const MARK = ${JSON.stringify({ x: markBox.minX, y: markBox.minY, w: markW, h: markH })};

export const LAYERS = ${JSON.stringify(boxes, null, 2)} as const;

export type LayerName = keyof typeof LAYERS;
`,
);

await markImg().resize(512).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/mark.webp`);
await markImg().resize(640).png({ compressionLevel: 9 }).toFile(`${OUT}/mark.png`);

// ---- favicon.ico: the mark on an ivory rounded square ----------------------
const markPng = await markImg().png().toBuffer();
async function faviconFrame(size) {
  const pad = Math.max(1, Math.round(size * 0.06));
  const inner = size - pad * 2;
  const fitted = await sharp(markPng)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const r = Math.round(size * 0.22);
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${IVORY}"/></svg>`,
  );
  return sharp(tile).composite([{ input: fitted, left: pad, top: pad }]).png().toBuffer();
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

console.log("stage", stageW, "x", stageH, "mark", markW, "x", markH);
console.log(boxes);
