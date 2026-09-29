import { SPLASH } from "./config";
import { runSplash, type SplashRuntime } from "./engine";
import { LAYERS, MARK, STAGE } from "./layers";
import { LEGS, STRIDE } from "./rig";

const runtime: SplashRuntime = {
  speed: SPLASH.speed,
  runStart: SPLASH.runStart,
  runEnd: SPLASH.runEnd,
  strides: SPLASH.strides,
  runInFromLogoWidths: SPLASH.runInFromLogoWidths,
  bob: SPLASH.bob,
  lean: SPLASH.lean,
  bounce: SPLASH.bounce,
  steamMs: SPLASH.steamMs,
  exitAt: SPLASH.exitAt,
  morphMs: SPLASH.morphMs,
  targetWaitMs: SPLASH.targetWaitMs,
  reducedHoldMs: SPLASH.reducedHoldMs,
  loadTimeoutMs: SPLASH.loadTimeoutMs,
  sessionKey: SPLASH.sessionKey,
  disableKey: SPLASH.disableKey,
  skipPaths: SPLASH.skipPaths,
  images: Object.values(LAYERS).map((l) => l.src),
  stage: STAGE,
  mark: MARK,
  stride: STRIDE,
  legs: [
    { name: "back", phaseAtRest: LEGS.back.phaseAtRest },
    { name: "front", phaseAtRest: LEGS.front.phaseAtRest },
  ],
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
