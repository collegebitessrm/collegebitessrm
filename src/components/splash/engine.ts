/**
 * The startup splash's motion — "The Drop" (storyboard in ./config.ts) — as
 * one self-contained function. It is never imported by client code:
 * ./init-script.ts serialises it with `runSplash.toString()` into a raw
 * inline <script> at the top of <body>, so it runs before first paint and
 * needs no bundle or hydration. Everything it uses must live inside it —
 * no imports, no helpers from module scope — and it must stay plain modern
 * JS once types are stripped.
 *
 * Web Animations on transform / opacity / clip-path, so it stays smooth
 * while the app's own JS boots underneath. It drives `data-splash` on
 * <html>: play → run → out → done. There's no tap-to-skip (it's under two
 * seconds), but it never traps anyone: if the rider or logo image isn't
 * ready within `loadTimeoutMs` it doesn't play, and the CSS hides the
 * overlay after 9 s whatever happens.
 *
 * Replay: `?intro` (or `?splash`); `?intro=golden` / `?intro=midnight`
 * force a variant.
 */

export type SplashRuntime = {
  pace: number;
  exitAt: number;
  exitMs: number;
  reducedHoldMs: number;
  loadTimeoutMs: number;
  goldenOdds: number;
  midnight: { from: number; to: number };
  sessionKey: string;
  disableKey: string;
  skipPaths: readonly string[];
  riderImage: string;
  markImage: string;
  dishes: readonly string[];
};

export function runSplash(C: SplashRuntime): void {
  const html = document.documentElement;
  const setState = (s: string) => html.setAttribute("data-splash", s);

  // ---- Play this load? ------------------------------------------------------
  let forcedVariant = "";
  try {
    const path = location.pathname;
    const query = location.search;
    for (const p of C.skipPaths) if (path === p || path.indexOf(p + "/") === 0) return;
    if (/[?&]nosplash(=|&|$)/.test(query)) return;
    const forced = /[?&](splash|intro)(=|&|$)/.test(query);
    const want = /[?&](?:splash|intro)=(golden|gold|midnight)/.exec(query);
    if (want) forcedVariant = want[1] === "midnight" ? "midnight" : "golden";
    if (!forced && localStorage.getItem(C.disableKey) === "off") return;
    if (!forced && sessionStorage.getItem(C.sessionKey)) return;
    if (document.visibilityState === "hidden") return;
    sessionStorage.setItem(C.sessionKey, "1");
  } catch {
    return;
  }

  setState("play");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- This run's surprises -------------------------------------------------
  const hour = new Date().getHours();
  let variant = "default";
  if (forcedVariant) variant = forcedVariant;
  else if (Math.random() < 1 / C.goldenOdds) variant = "golden";
  else if (hour >= C.midnight.from || hour < C.midnight.to) variant = "midnight";
  const dishSrc = C.dishes[Math.floor(Math.random() * C.dishes.length)];

  const decode = (src: string) => {
    const i = new Image();
    i.src = src;
    return i.decode();
  };
  const ready = Promise.all([decode(C.riderImage), decode(C.markImage)]);
  decode(dishSrc).catch(() => {}); // nice to have; the dish disc still flies if it's late

  let overlay: HTMLElement | null = null;
  let started = false;
  const t0 = Date.now();

  (function find() {
    const el = document.getElementById("app-splash");
    // The HTML streams in; wait for the whole overlay, not just its opening tag.
    if (el && el.querySelector('[data-sp="end"]')) {
      overlay = el;
      // Anything going wrong mid-way ends the splash at once (shows the app)
      // rather than leaving it up until the 9 s CSS failsafe.
      ready.then(
        () => {
          try {
            start();
          } catch {
            setState("done");
          }
        },
        () => setState("done"),
      );
      return;
    }
    if (Date.now() - t0 > C.loadTimeoutMs) return setState("done");
    setTimeout(find, 16);
  })();
  setTimeout(() => {
    if (!started) setState("done");
  }, C.loadTimeoutMs);

  function start() {
    if (started || !overlay) return;
    started = true;
    const root = overlay;
    html.setAttribute("data-splash-ran", "");
    setState("run");
    root.setAttribute("data-variant", variant);
    const one = (k: string) => root.querySelector<HTMLElement>(`[data-sp="${k}"]`)!;
    const all = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-sp="${k}"]`));

    if (reduce) {
      root.setAttribute("data-reduced", "");
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "both" });
      setTimeout(() => {
        setState("out");
        root
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "both" })
          .finished.then(
            () => setState("done"),
            () => setState("done"),
          );
      }, 220 + C.reducedHoldMs);
      return;
    }

    const W = innerWidth;
    const H = innerHeight;
    // Every storyboard time below is at pace 1; this stretches them all evenly.
    const PACE = C.pace > 0 ? C.pace : 1;
    const OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
    const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    // fill "both" shows an animation's first frame during its delay — right
    // for entrances. An animation that TAKES OVER an element already moved
    // by an earlier one must be "forwards", or its first frame would freeze
    // the element from time zero.
    const go = (
      el: Element | null,
      frames: Keyframe[],
      delay: number,
      duration: number,
      easing = "linear",
      fill: FillMode = "both",
    ) => (el ? el.animate(frames, { delay: delay * PACE, duration: duration * PACE, easing, fill }) : null);

    // The road: a cubic in screen percentages (same as the SVG path).
    const P = [
      [-8, 68],
      [25, 52],
      [52, 82],
      [108, 58],
    ];
    const at = (t: number) => {
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      return [
        ((a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0]) * W) / 100,
        ((a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]) * H) / 100,
      ];
    };
    const slope = (t: number) => {
      const u = 1 - t;
      const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
      const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
      const deg = (Math.atan2((dy * H) / 100, (dx * W) / 100) * 180) / Math.PI;
      return Math.max(-16, Math.min(16, deg));
    };
    const rider = one("rider");
    const rw = rider.offsetWidth;
    const rh = rider.offsetHeight;
    // Wheels on the road: the rider's bottom-centre sits on the curve.
    const pose = (t: number, extra = 0) => {
      const [x, y] = at(t);
      return `translate(${x - rw / 2}px, ${y - rh}px) rotate(${slope(t) + extra}deg)`;
    };
    const STOP = 0.72; // where the wheelie happens
    const run: Keyframe[] = [{ transform: `translate(${-rw * 1.2}px, ${at(0)[1] - rh}px) rotate(${slope(0)}deg)` }];
    for (let i = 0; i <= 9; i++) run.push({ transform: pose((STOP * i) / 9) });

    // 0–150: the headlight flickers on where he'll come in.
    const [hx, hy] = at(0.06);
    const light = one("headlight");
    light.style.left = `${hx}px`;
    light.style.top = `${hy - rh * 0.55}px`;
    go(light, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0.25, offset: 0.45 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], 0, 330);

    // 120–620: the road whips across; the rider rips along it, ghosts behind.
    go(one("road"), [{ opacity: 1, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)" }], 120, 320, "cubic-bezier(0.5, 0, 0.1, 1)");
    const runEase = "cubic-bezier(0.25, 0.7, 0.35, 1)";
    go(rider, run.map((f) => ({ ...f, opacity: 1 })), 150, 470, runEase);
    all("ghost").forEach((g, i) => {
      go(g, run, 150 + 40 * (i + 1), 470, runEase);
      g.animate([{ opacity: 0.5 - i * 0.14 }, { opacity: 0.5 - i * 0.14, offset: 0.8 }, { opacity: 0 }], {
        delay: (150 + 40 * (i + 1)) * PACE,
        duration: 520 * PACE,
        fill: "both",
      });
    });
    // The camera shudders as he passes the middle.
    go(
      one("cam"),
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(-3px, 2px)" },
        { transform: "translate(3px, -2px)" },
        { transform: "translate(-2px, -1px)" },
        { transform: "translate(0, 0)" },
      ],
      420,
      200,
    );

    // 620–700: wheelie off the end of the road (pivot: the rear wheel).
    const wheelie = one("wheelie");
    go(wheelie, [{ transform: "rotate(0deg)" }, { transform: "rotate(-24deg)" }], 600, 100, OUT);

    // 700–820: freeze frame — colour split + flash; the box bursts, a dish flies out.
    all("glitch").forEach((g, i) => {
      const s = i ? -1 : 1;
      go(
        g,
        [
          { opacity: 0, transform: "translate(0, 0)" },
          { opacity: 0.85, transform: `translate(${7 * s}px, ${-2 * s}px)` },
          { opacity: 0.6, transform: `translate(${-5 * s}px, ${2 * s}px)` },
          { opacity: 0.8, transform: `translate(${3 * s}px, 0)` },
          { opacity: 0, transform: "translate(0, 0)" },
        ],
        700,
        130,
      );
    });
    go(one("flash"), [{ opacity: 0 }, { opacity: 0.3, offset: 0.25 }, { opacity: 0 }], 700, 170, "ease-out");

    const dish = one("dish") as HTMLImageElement;
    dish.src = dishSrc;
    const ds = dish.offsetWidth;
    // Food box centre (22% across, 32% down the art), turned with the wheelie
    // about the rear wheel's contact point (19% across, the bottom).
    const [sx, sy] = at(STOP);
    const pivotX = sx - rw / 2 + rw * 0.19;
    const a = ((slope(STOP) - 24) * Math.PI) / 180;
    const ox = rw * 0.03;
    const oy = -rh * 0.68;
    const bx = pivotX + ox * Math.cos(a) - oy * Math.sin(a);
    const by = sy + ox * Math.sin(a) + oy * Math.cos(a);
    const flyTo = `translate(${W / 2 - ds / 2}px, ${H * 0.2 - ds / 2}px)`;
    go(
      dish,
      [
        // Starts invisible: with fill "both" the first frame shows during the delay.
        { opacity: 0, transform: `translate(${bx - ds / 2}px, ${by - ds / 2}px) scale(0.12) rotate(-35deg)` },
        { opacity: 1, offset: 0.08 },
        { opacity: 1, transform: `${flyTo} scale(1.1) rotate(8deg)`, offset: 0.55 },
        { opacity: 0, transform: `${flyTo} scale(1.45) rotate(14deg)` },
      ],
      720,
      420,
      OUT,
    );

    // 860–1080: he tears off to the right, landing the wheelie as he goes;
    // the trail burns out. (Take-overs: fill "forwards".)
    const away: Keyframe[] = [];
    for (let i = 0; i <= 4; i++) away.push({ transform: pose(STOP + ((1 - STOP) * i) / 4) });
    away.push({ transform: `translate(${W + rw * 0.3}px, ${at(1)[1] - rh}px) rotate(0deg)` });
    go(rider, away, 860, 220, "cubic-bezier(0.55, 0, 0.9, 0.45)", "forwards");
    go(wheelie, [{ transform: "rotate(-24deg)" }, { transform: "rotate(-4deg)" }], 860, 220, "ease-in", "forwards");
    go(one("road"), [{ opacity: 1 }, { opacity: 0 }], 900, 240, "ease-in", "forwards");

    // 860–1040: the logo tile slams in (squash on landing).
    const tile = one("tile");
    const base = "translate(-50%, -50%)";
    go(
      tile,
      [
        { opacity: 0, transform: `${base} scale(2.6) rotate(-12deg)` },
        { opacity: 1, transform: `${base} scale(0.88, 0.94) rotate(3deg)`, offset: 0.62 },
        { opacity: 1, transform: `${base} scale(1.04, 0.98) rotate(-1deg)`, offset: 0.82 },
        { opacity: 1, transform: `${base} scale(1) rotate(0deg)` },
      ],
      860,
      180,
      "ease-out",
    );

    // 1040: CHOMP. The bite switches on in one frame; the tile flinches; crumbs fly.
    setTimeout(() => tile.setAttribute("data-bitten", ""), 1040 * PACE);
    go(
      tile,
      [
        { transform: `${base} scale(1) rotate(0deg)` },
        { transform: `${base} scale(0.94) rotate(-5deg)` },
        { transform: `${base} scale(1.03) rotate(3deg)` },
        { transform: `${base} scale(1) rotate(0deg)` },
      ],
      1040,
      200,
      "ease-out",
      "forwards",
    );
    const fling = [
      [46, -70, 140],
      [78, -30, -90],
      [30, -100, 220],
      [96, 6, 160],
      [60, -86, -200],
      [18, -60, 120],
      [88, -58, -140],
    ];
    all("crumb").forEach((c, i) => {
      const [fx, fy, rot] = fling[i % fling.length];
      go(
        c,
        [
          { opacity: 0, transform: "translate(0, 0) rotate(0deg) scale(1)" },
          { opacity: 1, offset: 0.05 },
          { opacity: 1, transform: `translate(${fx * 0.7}px, ${fy}px) rotate(${rot / 2}deg)`, offset: 0.45 },
          { opacity: 0, transform: `translate(${fx}px, ${fy + 70}px) rotate(${rot}deg) scale(0.7)` },
        ],
        1040 + i * 12,
        420,
        "cubic-bezier(0.2, 0.6, 0.4, 1)",
      );
    });

    // 1060–1450: "College" punches in, "Bites" brushes on, the sticker pops.
    all("letter").forEach((l, i) => {
      const tilt = [-12, 9, -6, 11, -9, 7, -10][i % 7];
      go(
        l,
        [
          { opacity: 0, transform: `translateY(-35%) scale(1.9) rotate(${tilt}deg)`, filter: "blur(6px)" },
          { opacity: 1, transform: "translateY(0) scale(1) rotate(0deg)", filter: "blur(0)" },
        ],
        1060 + i * 24,
        230,
        SPRING,
      );
    });
    go(
      one("bites"),
      [
        { opacity: 1, clipPath: "inset(-20% 100% -20% -10%)", transform: "skewX(-14deg) translateX(-6%)" },
        { opacity: 1, clipPath: "inset(-20% -10% -20% -10%)", transform: "skewX(-6deg) translateX(0)" },
      ],
      1180,
      220,
      OUT,
    );
    all("sticker").forEach((s) =>
      go(
        s,
        [
          { opacity: 0, transform: "rotate(-16deg) scale(0.4)" },
          { opacity: 1, transform: "rotate(-5deg) scale(1)" },
        ],
        1290,
        200,
        SPRING,
      ),
    );

    // 1500: the night wipes away the way he rode; the tile docks into the page.
    setTimeout(exit, C.exitAt * PACE);

    function exit() {
      setState("out");
      const night = one("night");
      night.animate(
        [
          { clipPath: "polygon(-30% 0%, 130% 0%, 130% 100%, -10% 100%)" },
          { clipPath: "polygon(110% 0%, 130% 0%, 130% 100%, 130% 100%)" },
        ],
        { duration: C.exitMs * PACE, easing: "cubic-bezier(0.7, 0, 0.25, 1)", fill: "both" },
      );
      all("crumb").forEach((c) => c.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "both" }));

      const target = document.querySelector("[data-splash-target]");
      const r = target ? target.getBoundingClientRect() : null;
      const tr = tile.getBoundingClientRect();
      let done: Animation;
      if (r && r.width > 0 && r.bottom > 0 && r.top < H) {
        const dx = r.left + r.width / 2 - (tr.left + tr.width / 2);
        const dy = r.top + r.height / 2 - (tr.top + tr.height / 2);
        const k = r.width / tr.width;
        // The flight eases over most of the exit (per-keyframe easing, so the
        // short fade at the end doesn't squash it), landing on the real logo.
        done = tile.animate(
          [
            { opacity: 1, transform: `${base} scale(1)`, easing: "cubic-bezier(0.5, 0, 0.15, 1)" },
            { opacity: 1, transform: `${base} translate(${dx}px, ${dy}px) scale(${k})`, offset: 0.88 },
            { opacity: 0, transform: `${base} translate(${dx}px, ${dy}px) scale(${k})` },
          ],
          { duration: C.exitMs * PACE, fill: "both" },
        );
      } else {
        done = tile.animate(
          [
            { opacity: 1, transform: `${base} scale(1)` },
            { opacity: 0, transform: `${base} scale(0.6)` },
          ],
          { duration: C.exitMs * PACE, easing: "ease-in", fill: "both" },
        );
      }
      done.finished.then(
        () => setState("done"),
        () => setState("done"),
      );
    }
  }
}
