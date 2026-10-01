import { SPLASH } from "./config";
import { runSplash, type SplashRuntime } from "./engine";

const runtime: SplashRuntime = {
  enterMs: SPLASH.enterMs,
  textDelayMs: SPLASH.textDelayMs,
  holdMs: SPLASH.holdMs,
  exitMs: SPLASH.exitMs,
  reducedHoldMs: SPLASH.reducedHoldMs,
  loadTimeoutMs: SPLASH.loadTimeoutMs,
  sessionKey: SPLASH.sessionKey,
  disableKey: SPLASH.disableKey,
  skipPaths: SPLASH.skipPaths,
  image: "/brand/mark-v2-1.webp",
};

/**
 * The splash engine as a raw inline script (layout.tsx renders it with
 * dangerouslySetInnerHTML at the top of <body> — not next/script, whose
 * beforeInteractive inline scripts are queued until Next's JS loads).
 * `runSplash.toString()` is the compiled function source, so engine.ts
 * must stay self-contained. `?nosplash` skips it for one load; `?intro`
 * (or `?splash`) replays it.
 */
export const SPLASH_INIT_SCRIPT = `(${runSplash.toString()})(${JSON.stringify(runtime)});`;
