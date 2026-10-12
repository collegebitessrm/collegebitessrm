/**
 * Every knob for the startup splash, "One Bite" (the motion is in
 * ./engine.ts). Times are milliseconds from the moment it starts.
 *
 * Storyboard (~1.5 s, no tap-to-skip — it's shorter than a skip would be):
 * 0–350 the screen is the logo's own indigo with a soft glow; the logo
 * tile eases in out of a slight blur
 * 100–600 the graduation cap drops into the tile (gravity, a bounce, the
 * tassel swings); the tile bumps as it lands
 * 520–860 a sheen catches the tile
 * 520–820 "College Bites" and the tagline rise in
 * 950 CHOMP — a scalloped bite snaps out of the screen's top-right
 * corner (the bite in the logo's "COLLEGE"); the tile flinches
 * 1030–1490 the bite opens across the whole screen onto the app, while the
 * tile glides into the page's own logo (`BrandLogo splashTarget`)
 */
export const SPLASH = {
 /** When the bite snaps in, and when it starts opening onto the app. */
 biteAt: 950,
 openAt: 1030,
 /** How long the opening (and the tile's flight to the logo) takes. */
 openMs: 460,
 /** Reduced motion: no motion — the finished logo fades in, holds, fades out. */
 reducedHoldMs: 650,
 /** Longest wait for the logo layers; past this the splash just doesn't play. */
 loadTimeoutMs: 1500,
 /** Last resort (CSS): the splash hides itself after this no matter what. */
 failsafeMs: 9000,
 /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
 sessionKey: "collegebites.splash-shown",
 /** localStorage key; set it to "off" to disable on one device. */
 disableKey: "collegebites.splash",
 /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages). */
 skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
 /** The tile without its cap, and the cap (scripts/build-brand-assets.mjs). */
 tileImage: "/brand/mark-v2-1-nocap.webp",
 capImage: "/brand/mark-v2-1-cap.webp",
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
