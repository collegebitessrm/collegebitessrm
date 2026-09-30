/**
 * Every knob for the startup splash (a short logo fade-in; the motion is
 * in ./engine.ts). Times are milliseconds.
 *
 * Storyboard:
 *   0–520      the logo tile rises in and settles (slight scale + fade)
 *   180–620    "College Bites" and the tagline follow
 *   620–1300   hold
 *   1300–1650  the mint screen fades away to the app
 */
export const SPLASH = {
  /** Logo tile rise-in. */
  enterMs: 520,
  /** Delay before the wordmark/tagline follow the tile. */
  textDelayMs: 180,
  /** How long the finished logo holds before the fade-out starts. */
  holdMs: 680,
  /** Fade-out of the whole screen. */
  exitMs: 350,
  /** Reduced motion: no rise, just a fade in, a short hold and a fade out. */
  reducedHoldMs: 650,
  /** Longest wait for the logo image; past this the splash just doesn't play. */
  loadTimeoutMs: 2500,
  /** Last resort (CSS): the splash hides itself after this no matter what. */
  failsafeMs: 9000,
  /** sessionStorage flag — plays once per browser session (each fresh app open, not per route). */
  sessionKey: "collegebites.splash-shown",
  /** localStorage key; set it to "off" to disable on one device. */
  disableKey: "collegebites.splash",
  /** Never on these (admin tool, OAuth callback, Google's review bot on the legal pages). */
  skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
