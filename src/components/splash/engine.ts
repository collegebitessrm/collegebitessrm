/**
 * The startup splash's motion, as one self-contained function. It is never
 * imported by client code: ./init-script.ts serialises it with
 * `runSplash.toString()` into a raw inline <script> at the top of <body>,
 * so it runs before first paint and needs no bundle or hydration. That
 * means everything it uses must live inside it — no imports, no helpers
 * from module scope — and it must stay plain modern JS once types are
 * stripped.
 *
 * All motion is the Web Animations API on transform / opacity of HTML
 * elements (the legs too — they're divs, not SVG), so the browser runs it
 * on the compositor and it stays smooth while the app's own JS boots
 * underneath. It drives `data-splash` on <html>:
 *   play → run → out → done
 * and never traps anyone: tap skips, slow images fade out, the CSS hides
 * the overlay after `failsafeMs` whatever happens.
 */

type Box = { x: number; y: number; w: number; h: number };
type StrideKey = { at: number; thigh: number; knee: number; foot: number };

export type SplashRuntime = {
  speed: number;
  runStart: number;
  runEnd: number;
  strides: number;
  runInFromLogoWidths: number;
  bob: number;
  lean: number;
  bounce: number;
  steamMs: number;
  exitAt: number;
  morphMs: number;
  targetWaitMs: number;
  reducedHoldMs: number;
  loadTimeoutMs: number;
  sessionKey: string;
  disableKey: string;
  skipPaths: readonly string[];
  images: string[];
  stage: Box;
  mark: Box;
  stride: StrideKey[];
  legs: { name: string; phaseAtRest: number }[];
};

export function runSplash(C: SplashRuntime): void {
  const html = document.documentElement;
  const setState = (s: string) => html.setAttribute("data-splash", s);

  // ---- Play this load? ------------------------------------------------------
  try {
    const path = location.pathname;
    const query = location.search;
    for (const p of C.skipPaths) if (path === p || path.indexOf(p + "/") === 0) return;
    if (/[?&]nosplash(=|&|$)/.test(query)) return;
    const forced = /[?&](splash|intro)(=|&|$)/.test(query);
    if (!forced && localStorage.getItem(C.disableKey) === "off") return;
    if (!forced && sessionStorage.getItem(C.sessionKey)) return;
    if (document.visibilityState === "hidden") return;
    sessionStorage.setItem(C.sessionKey, "1");
  } catch {
    return;
  }

  setState("play");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = (ms: number) => ms * C.speed;
  const loaded = C.images.map((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    const img = new Image();
    img.src = src;
    return img.decode();
  });

  let overlay: HTMLElement | null = null;
  let started = false;
  let ended = false;
  const running: Animation[] = [];
  const t0 = Date.now();

  const q = (name: string) => overlay!.querySelector<HTMLElement>(`[data-sp="${name}"]`)!;
  const qa = (name: string) => Array.from(overlay!.querySelectorAll<HTMLElement>(`[data-sp="${name}"]`));
  const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, Object.assign({ fill: "both" }, opts) as KeyframeAnimationOptions);
    running.push(a);
    return a;
  };

  // ---- Wait for the overlay markup and the layer images --------------------
  (function find() {
    const el = document.getElementById("app-splash");
    // The HTML streams in; wait for the whole overlay, not just its opening tag.
    if (el && el.querySelector('[data-sp="tagline"]')) {
      overlay = el;
      el.addEventListener("click", () => exit(true));
      Promise.all(loaded).then(start, () => exit(true));
      return;
    }
    if (Date.now() - t0 > C.loadTimeoutMs) return setState("done");
    setTimeout(find, 16);
  })();
  setTimeout(() => {
    if (!started) exit(true);
  }, C.loadTimeoutMs);

  function start() {
    if (started || ended || !overlay) return;
    started = true;
    html.setAttribute("data-splash-ran", "");
    setState("run");
    if (reduce) {
      play(q("stage"), [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      setTimeout(() => exit(false), 220 + C.reducedHoldMs);
    } else {
      storyboard();
      setTimeout(() => exit(false), T(C.exitAt));
    }
  }

  // ---- The run cycle ---------------------------------------------------------
  // Catmull-Rom through the stride keys, wrapping around the cycle.
  function pose(phase: number) {
    const k = C.stride;
    const n = k.length;
    const ph = ((phase % 1) + 1) % 1;
    let i = n - 1;
    while (i > 0 && k[i].at > ph) i--;
    const a = k[i];
    const b = k[(i + 1) % n];
    const p0 = k[(i - 1 + n) % n];
    const p3 = k[(i + 2) % n];
    const span = (b.at - a.at + 1) % 1 || 1;
    const t = (((ph - a.at + 1) % 1) / span) || 0;
    const cr = (v0: number, v1: number, v2: number, v3: number) =>
      0.5 * (2 * v1 + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t * t + (-v0 + 3 * v1 - 3 * v2 + v3) * t * t * t);
    return {
      thigh: cr(p0.thigh, a.thigh, b.thigh, p3.thigh),
      knee: cr(p0.knee, a.knee, b.knee, p3.knee),
      foot: cr(p0.foot, a.foot, b.foot, p3.foot),
    };
  }

  function storyboard() {
    const stage = q("stage");
    q("rig").style.visibility = "visible";
    const unit = stage.getBoundingClientRect().width / C.stage.w; // CSS px per source-art px
    const runStart = T(C.runStart);
    const runDur = T(C.runEnd - C.runStart);
    const runEnd = runStart + runDur;
    const S = C.strides;
    const N = S * 16;
    const sin2 = (x: number) => Math.sin(x) ** 2;

    // Strides slow down as the mascot arrives: sample evenly in stride
    // progress, place each sample at the time that progress is reached.
    const samples: { offset: number; phase: number; p: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      samples.push({ offset: 1 - (1 - p) ** (1 / 1.8), phase: p * S, p });
    }
    const runOpts = { duration: runDur, delay: runStart, easing: "linear" };

    // Travel: from just off the left edge to centre, fast then settling.
    const from = -(innerWidth / 2 + C.runInFromLogoWidths * C.stage.w * unit);
    const travel: Keyframe[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      travel.push({ offset: u, transform: `translateX(${(from * (1 - u) ** 2.3).toFixed(2)}px)` });
    }
    play(q("run"), travel, runOpts);

    // Legs: every joint rotates relative to the drawn pose.
    for (const leg of C.legs) {
      const rest = pose(leg.phaseAtRest);
      const joints = { thigh: q(`${leg.name}-hip`), knee: q(`${leg.name}-knee`), foot: q(`${leg.name}-foot`) };
      for (const j of ["thigh", "knee", "foot"] as const) {
        play(
          joints[j],
          samples.map((s) => ({
            offset: s.offset,
            transform: `rotate(${(pose(leg.phaseAtRest + s.phase)[j] - rest[j]).toFixed(2)}deg)`,
          })),
          runOpts,
        );
      }
    }
    const front = C.legs.find((l) => l.name === "front")!;
    const stepAt = (s: { phase: number }) => 2 * Math.PI * (front.phaseAtRest + s.phase);

    // Body: lowest on each foot-strike, highest mid-flight; the bob eases
    // off in the last stride. Forward lean fades as it slows.
    play(
      q("bob"),
      samples.map((s) => ({
        offset: s.offset,
        transform: `translateY(${(-C.bob * unit * sin2(stepAt(s)) * (1 - 0.4 * s.p)).toFixed(2)}px)`,
      })),
      runOpts,
    );
    play(
      q("lean"),
      samples.map((s) => ({ offset: s.offset, transform: `rotate(${(C.lean * (1 - s.p) ** 0.8).toFixed(2)}deg)` })),
      runOpts,
    );

    // Speed trails stretch out behind, pulsing with each stride, then
    // snap back to their drawn length as it lands.
    play(
      q("trails"),
      samples
        .map((s) => ({
          offset: s.offset * (runDur / (runDur + T(300))),
          transform: `scaleX(${(1.7 + 0.22 * sin2(stepAt(s))).toFixed(3)})`,
          opacity: String(Math.min(1, s.p * 6)),
        }))
        .concat([{ offset: 1, transform: "none", opacity: "1" }]),
      { duration: runDur + T(300), delay: runStart, easing: "linear" },
    );

    // The tray and cloche ride a beat behind the body's bounce.
    play(
      q("tray"),
      samples.map((s) => ({
        offset: s.offset,
        // Fades to nothing by the landing, so the drawn pose is exact at rest.
        transform: `rotate(${(2.4 * Math.sin(2 * stepAt(s) - 0.9) * (1 - s.p) ** 0.6).toFixed(2)}deg)`,
      })),
      runOpts,
    );
    const lid = q("lid");
    play(
      lid,
      samples.map((s) => ({
        offset: s.offset,
        transform: `translateY(${(-3 * unit * Math.max(0, Math.sin(2 * stepAt(s) - 1.3)) * (1 - s.p) ** 0.6).toFixed(2)}px) rotate(${(1.8 * Math.sin(2 * stepAt(s) - 1.8) * (1 - s.p) ** 0.6).toFixed(2)}deg)`,
      })),
      runOpts,
    );

    // Steam streams back off the cloche while running, then rises once it's still.
    qa("wisp-run").forEach((w, i) =>
      play(
        w,
        [
          { opacity: 0, transform: "translate(0px, 0px) scale(0.7)" },
          { opacity: 0.75, offset: 0.25 },
          { opacity: 0, transform: `translate(${-70 * unit}px, ${-78 * unit}px) scale(1.2)` },
        ],
        { duration: T(C.steamMs), delay: runStart + T(140 + i * 150), iterations: 2, easing: "cubic-bezier(0.3, 0.6, 0.5, 1)" },
      ),
    );

    // ---- Landing ----
    const b = C.bounce;
    play(
      q("land"),
      [
        { transform: "none" },
        { offset: 0.22, transform: `translateY(${7 * unit}px) scale(${1 + b / 3}, ${1 - b})` },
        { offset: 0.6, transform: `translateY(${-5 * unit}px) scale(${1 - b / 5}, ${1 + (b * 2) / 3})` },
        { transform: "none" },
      ],
      { duration: T(260), delay: runEnd - T(10), easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
    );
    // The vector rig hands over to the drawn legs, now in the same pose.
    play(q("legs"), [{ opacity: 0 }, { opacity: 1 }], { duration: T(90), delay: runEnd, easing: "linear" });
    play(q("rig"), [{ opacity: 1 }, { opacity: 0 }], { duration: T(90), delay: runEnd + T(40), easing: "linear" });
    play(
      q("tray"),
      [
        { transform: "rotate(0deg)" },
        { offset: 0.2, transform: "rotate(3.2deg)" },
        { offset: 0.45, transform: "rotate(-1.6deg)" },
        { offset: 0.7, transform: "rotate(0.6deg)" },
        { transform: "rotate(0deg)" },
      ],
      { duration: T(480), delay: runEnd, easing: "ease-out", composite: "add" },
    );
    play(
      q("swoosh"),
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
      { duration: T(360), delay: T(880), easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );

    // ---- Cloche settles: the lid lifts, a little warmth, steam rises ----
    play(
      lid,
      [
        { transform: "none" },
        { offset: 0.35, transform: `translateY(${-12 * unit}px) rotate(-8deg)` },
        { offset: 0.6, transform: `translateY(${-8 * unit}px) rotate(-5deg)` },
        { offset: 0.82, transform: `translateY(${1 * unit}px) rotate(1deg)` },
        { transform: "none" },
      ],
      { duration: T(380), delay: T(1000), easing: "ease-in-out", composite: "add" },
    );
    play(
      q("glow"),
      [
        { opacity: 0, transform: "scale(0.6)" },
        { offset: 0.45, opacity: 0.85, transform: "scale(1)" },
        { opacity: 0, transform: "scale(1.1)" },
      ],
      { duration: T(420), delay: T(1000), easing: "ease-out" },
    );
    play(
      q("steam"),
      [{ opacity: 0, transform: `translateY(${36 * unit}px) scale(0.9, 0.75)` }, { opacity: 1, transform: "none" }],
      { duration: T(420), delay: T(1060), easing: "ease-out" },
    );
    qa("wisp-rise").forEach((w, i) =>
      play(
        w,
        [
          { opacity: 0, transform: "translate(0px, 0px) scale(0.8)" },
          { opacity: 0.7, offset: 0.3 },
          { opacity: 0, transform: `translate(${(i ? -12 : 10) * unit}px, ${-95 * unit}px) scale(1.15)` },
        ],
        { duration: T(C.steamMs * 1.5), delay: T(1080 + i * 130), easing: "cubic-bezier(0.25, 0.5, 0.4, 1)" },
      ),
    );

    // ---- Wordmark, then tagline ----
    play(
      q("wordmark"),
      [{ opacity: 0, transform: `translateY(${24 * unit}px) scale(0.96)` }, { opacity: 1, transform: "none" }],
      { duration: T(450), delay: T(1100), easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    play(
      q("tagline"),
      [{ opacity: 0, transform: `translateY(${16 * unit}px)` }, { opacity: 1, transform: "none" }],
      { duration: T(350), delay: T(1400), easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }

  // ---- Into the app ------------------------------------------------------------
  function exit(fast: boolean) {
    if (ended || !overlay) {
      if (!overlay) setState("done");
      return;
    }
    ended = true;
    // A tap mid-run jumps straight to the finished logo before closing.
    for (const a of running) a.finish();
    if (!started || reduce) return fadeOut(fast);
    const deadline = Date.now() + (fast ? 0 : T(C.targetWaitMs));
    (function look() {
      const tile = document.querySelector<HTMLElement>("[data-splash-target]");
      const mark = tile && tile.querySelector("img");
      const r = tile && tile.getBoundingClientRect();
      if (tile && mark && r && r.width > 12 && r.bottom > 0 && r.top < innerHeight) {
        return morph(tile, mark, fast);
      }
      // Only worth waiting while the page is still on its loading skeleton
      // (every loading.tsx marks itself aria-busy); a page without a logo
      // tile just gets the plain fade.
      if (Date.now() < deadline && document.querySelector('[aria-busy="true"]')) return void setTimeout(look, 60);
      fadeOut(fast);
    })();
  }

  // The whole ivory screen closes down into the page's own logo tile while
  // the mascot shrinks onto the tile's mark — the splash becomes the logo.
  function morph(tile: HTMLElement, mark: HTMLElement, fast: boolean) {
    const el = overlay!;
    const stage = q("stage");
    setState("out");
    const dur = T(fast ? 340 : C.morphMs);
    const easing = "cubic-bezier(0.65, 0, 0.25, 1)";
    const S = stage.getBoundingClientRect();
    const k = S.width / C.stage.w;
    const Rx = S.left + (C.mark.x - C.stage.x) * k;
    const Ry = S.top + (C.mark.y - C.stage.y) * k;
    const M = mark.getBoundingClientRect();
    const s = M.width / (C.mark.w * k);
    const tx = M.left - S.left - s * (Rx - S.left);
    const ty = M.top - S.top - s * (Ry - S.top);
    stage.animate([{ transform: "none" }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], {
      duration: dur,
      easing,
      fill: "forwards",
    });
    for (const name of ["wordmark", "tagline", "swoosh"]) {
      q(name).animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, easing: "ease-in", fill: "forwards" });
    }
    const t = tile.getBoundingClientRect();
    const radius = getComputedStyle(tile).borderTopLeftRadius || "0px";
    el.animate(
      [
        { clipPath: "inset(0px 0px 0px 0px round 0px)" },
        {
          clipPath: `inset(${t.top}px ${innerWidth - t.right}px ${innerHeight - t.bottom}px ${t.left}px round ${radius})`,
        },
      ],
      { duration: dur, easing, fill: "forwards" },
    );
    const main = document.querySelector("main");
    if (main) main.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: dur, easing: "ease-out" });
    setTimeout(() => setState("done"), dur + 30);
  }

  // No logo tile on this page (or reduced motion): a short, plain fade.
  function fadeOut(fast: boolean) {
    const el = overlay!;
    setState("out");
    const dur = reduce ? 220 : T(fast ? 200 : 320);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: "ease-in", fill: "forwards" });
    if (!reduce && started) {
      q("stage").animate([{ transform: "none" }, { transform: "scale(0.96)" }], { duration: dur, easing: "ease-in", fill: "forwards" });
    }
    setTimeout(() => setState("done"), dur + 30);
  }
}
