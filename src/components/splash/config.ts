/**
 * Every knob for the startup splash, "The Drop" (the motion is in
 * ./engine.ts). Times are milliseconds from the moment it starts.
 *
 * Storyboard (1.85 s, no tap-to-skip — it's shorter than a skip would be):
 *   0–150      night, in the palette's own ink; a headlight flickers on
 *   120–620    the neon road whips across; the side-on rider rips along it
 *              with speed ghosts behind, the camera shudders as it passes
 *   620–700    wheelie off the end of the road
 *   700–820    freeze frame: colour-split glitch + flash; the food box bursts
 *              and a real dish (random each open) flies at the camera
 *   860–1060   the rider tears off; the logo tile slams in
 *   1080       CHOMP — a bite out of the tile's corner, crumbs fly
 *   1080–1460  "College" punches in letter by letter, "Bites" brushes on,
 *              the tagline sticker pops
 *   1460–1850  the night wipes away left-to-right (the way he rode) and the
 *              tile flies into the page's own logo
 *
 * Rewatch hooks: a random dish every open; about 1 in 15 opens is a
 * Golden Run (gold trail, gold crumbs, its own sticker); from 10 PM to 5 AM
 * it's Midnight Cravings (moon, stars, cool neon). The trail and type use
 * each palette's hero stops, so the four themes each get their own run.
 */
export const SPLASH = {
  /** Total length; the exit wipe starts at exitAt and lasts exitMs. */
  exitAt: 1460,
  exitMs: 390,
  /** Reduced motion: no run — the finished logo fades in, holds, fades out. */
  reducedHoldMs: 650,
  /** Longest wait for the rider and logo images; past this the splash doesn't play. */
  loadTimeoutMs: 1500,
  /** Last resort (CSS): the splash hides itself after this no matter what. */
  failsafeMs: 9000,
  /** Roughly 1 in this many opens is a Golden Run. */
  goldenOdds: 15,
  /** Local hours (24 h) that count as midnight: from `from` until `to`. */
  midnight: { from: 22, to: 5 },
  /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
  sessionKey: "collegebites.splash-shown",
  /** localStorage key; set it to "off" to disable on one device. */
  disableKey: "collegebites.splash",
  /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages). */
  skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
  /** Built by scripts/build-splash-assets.mjs (a changed image gets a new name). */
  riderImage: "/photos/splash/rider-side-v1.webp",
  markImage: "/brand/mark-v2-1.webp",
  dishes: [
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
  ].map((d) => `/photos/splash/${d}.webp`),
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
