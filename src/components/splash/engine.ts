/**
 * The startup splash's motion, as one self-contained function. It is never
 * imported by client code: ./init-script.ts serialises it with
 * `runSplash.toString()` into a raw inline <script> at the top of <body>,
 * so it runs before first paint and needs no bundle or hydration. That
 * means everything it uses must live inside it — no imports, no helpers
 * from module scope — and it must stay plain modern JS once types are
 * stripped.
 *
 * Web Animations on transform / opacity only, so it stays smooth while the
 * app's own JS boots underneath. It drives `data-splash` on <html>:
 *   play → run → out → done
 * and never traps anyone: tap skips, a slow logo image means it doesn't
 * play at all, and the CSS hides the overlay after `failsafeMs` whatever
 * happens.
 */

export type SplashRuntime = {
  enterMs: number;
  textDelayMs: number;
  holdMs: number;
  exitMs: number;
  reducedHoldMs: number;
  loadTimeoutMs: number;
  sessionKey: string;
  disableKey: string;
  skipPaths: readonly string[];
  image: string;
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
  const img = new Image();
  img.src = C.image;
  const loaded = img.decode();

  let overlay: HTMLElement | null = null;
  let started = false;
  let ended = false;
  const t0 = Date.now();

  (function find() {
    const el = document.getElementById("app-splash");
    // The HTML streams in; wait for the whole overlay, not just its opening tag.
    if (el && el.querySelector('[data-sp="tagline"]')) {
      overlay = el;
      el.addEventListener("click", () => exit());
      loaded.then(start, () => setState("done"));
      return;
    }
    if (Date.now() - t0 > C.loadTimeoutMs) return setState("done");
    setTimeout(find, 16);
  })();
  setTimeout(() => {
    if (!started) setState("done");
  }, C.loadTimeoutMs);

  function start() {
    if (started || ended || !overlay) return;
    started = true;
    html.setAttribute("data-splash-ran", "");
    setState("run");
    const mark = overlay.querySelector('[data-sp="mark"]')!;
    const words = overlay.querySelectorAll('[data-sp="word"], [data-sp="tagline"]');
    if (reduce) {
      overlay.querySelector('[data-sp="stage"]')!.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 220,
        fill: "both",
      });
      setTimeout(exit, 220 + C.reducedHoldMs);
      return;
    }
    const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
    mark.animate(
      [
        { opacity: 0, transform: "translateY(18px) scale(0.86)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: C.enterMs, easing: ease, fill: "both" },
    );
    words.forEach((w, i) =>
      w.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: C.enterMs - 80, delay: C.textDelayMs + i * 90, easing: ease, fill: "both" },
      ),
    );
    setTimeout(exit, C.textDelayMs + C.enterMs + C.holdMs);
  }

  function exit() {
    if (ended) return;
    ended = true;
    if (!overlay || !started) return setState("done");
    setState("out");
    overlay
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 220 : C.exitMs, easing: "ease-in", fill: "both" })
      .finished.then(
        () => setState("done"),
        () => setState("done"),
      );
  }
}
