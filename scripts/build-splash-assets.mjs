// Builds the startup splash's images ("The Drop", src/components/splash/):
//
//   public/photos/splash/rider-side-v1.webp  the side-profile rider, trimmed
//                                             to its art, 560 px wide
//   public/photos/splash/<dish>.webp          small round-crop thumbnails of
//                                             real menu dishes for the dish
//                                             that flies out of the food box
//                                             (one is picked at random)
//
// The splash plays on every fresh app open, before the app has loaded, so
// everything it shows is tiny: ~40 KB rider, ~8 KB per dish (only the one
// picked is downloaded). Source: public/photos/promo/rider-side.png (the
// generated side-profile rider, transparent) and public/photos/dishes/.
//
// A changed image gets a new name (rider-side-v2, …) — never an overwrite;
// see the cache rule in CLAUDE.md. Update SPLASH.riderImage / SPLASH.dishes
// in src/components/splash/config.ts to match.
//
// Run:  node scripts/build-splash-assets.mjs

import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/photos/splash";
const RIDER_SRC = "public/photos/promo/rider-side.png";
const RIDER_OUT = `${OUT}/rider-side-v1.webp`;
export const DISHES = [
  "chicken-dum-biryani",
  "mixed-chicken-biryani",
  "chicken-fried-rice",
  "chicken-noodles",
  "chilli-chicken",
  "chicken-lollipop",
  "egg-biryani",
  "paneer-65",
  "gobi-manchurian",
  "schezwan-noodles",
  "chicken-65",
  "paneer-biryani",
];

await mkdir(OUT, { recursive: true });

// Rider: trim the transparent margin (sharp's trim works on alpha), then size.
const rider = await sharp(RIDER_SRC).trim({ threshold: 8 }).toBuffer({ resolveWithObject: true });
await sharp(rider.data).resize({ width: 560 }).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toFile(RIDER_OUT);
const meta = await sharp(RIDER_OUT).metadata();
console.log("rider", RIDER_OUT, `${meta.width}x${meta.height}`);

// Dishes: a centred square crop, 192 px (shown at ~120–150 css px on a 2x screen
// it's a touch soft mid-flight, which nobody sees at that speed).
for (const name of DISHES) {
  await sharp(`public/photos/dishes/${name}.jpg`)
    .resize(192, 192, { fit: "cover", position: "attention" })
    .webp({ quality: 72, effort: 6 })
    .toFile(`${OUT}/${name}.webp`);
}
console.log("dishes", DISHES.length);
