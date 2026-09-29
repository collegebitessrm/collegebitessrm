/**
 * Every knob for the startup splash. Times are milliseconds at speed 1 and
 * are all scaled by `speed`; the motion itself lives in ./engine.ts.
 *
 * Storyboard (speed 1):
 *   0–150      warm ivory
 *   150–850    the mascot runs in: 3 strides that slow as it arrives,
 *              body bob + lean, stretched speed trails, the tray and
 *              cloche bouncing a beat behind, steam streaming back
 *   850–1100   landing: feet plant, squash, rebound, settle
 *   880–1240   the ground swoosh draws in
 *   1000–1350  cloche settles, lid lifts, warm glow + steam rises
 *   1100–1550  "MuteBites" rises in
 *   1400–1750  the tagline follows
 *   1750–2000  hold
 *   2000–2480  the ivory screen closes into the app's own logo tile
 *              (login page / Home header), the mascot landing on its mark
 */
export const SPLASH = {
  /** Multiplies every time below. 1.2 = 20% slower, 0.85 = snappier. */
  speed: 1,
  /** When the mascot starts running in, and when it lands. */
  runStart: 150,
  runEnd: 850,
  /** Strides during the run-in (whole numbers only — the rig must finish in the drawn pose). */
  strides: 3,
  /**
   * How far off-screen the run starts: half the viewport plus this fraction
   * of the logo's width. 0.45 puts the mascot's nose just past the left
   * edge; 0.2 gives a shorter run.
   */
  runInFromLogoWidths: 0.45,
  /** Body bob per stride, in source-art pixels (the logo is ~1120 wide). */
  bob: 22,
  /** Forward lean while running, degrees. */
  lean: 6,
  /** Landing squash: 0.03 plays scaleY 1 → 0.97 → 1.02 → 1. 0 turns it off. */
  bounce: 0.03,
  /** Life of each steam wisp. */
  steamMs: 460,
  /** When the logo starts closing into the app. */
  exitAt: 2000,
  /** Length of that close. */
  morphMs: 480,
  /** Longest the finished logo waits for the page's logo tile to render before just fading. */
  targetWaitMs: 1200,
  /** Reduced motion: how long the still logo holds before fading out. */
  reducedHoldMs: 650,
  /** Longest wait for the layer images; past this the splash just fades out. */
  loadTimeoutMs: 2500,
  /** Last resort (CSS): the splash hides itself after this no matter what. */
  failsafeMs: 9000,
  /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
  sessionKey: "mutebites.splash-shown",
  /** localStorage key; set it to "off" to disable on one device. */
  disableKey: "mutebites.splash",
  /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages). */
  skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
