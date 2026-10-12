/**
 * The startup splash's motion — "One Bite" (storyboard in ./config.ts) — as
 * one self-contained function. It is never imported by client code:
 * ./init-script.ts serialises it with `runSplash.toString()` into a raw
 * inline <script> at the top of <body>, so it runs before first paint and
 * needs no bundle or hydration. Everything it uses must live inside it — no
 * imports, no helpers from module scope — and it must stay plain modern JS
 * once types are stripped.
 *
 * Web Animations on transform / opacity, plus the bite's radii (registered
 * custom properties, see splash.css), so it stays smooth while the app's own
 * JS boots underneath. It drives `data-splash` on <html>:
 * play → run → out → done. No tap-to-skip (it's ~1.5 s), but it never traps
 * anyone: if the logo layers aren't ready within `loadTimeoutMs` it doesn't
 * play, any error mid-way ends it at once, and the CSS hides the overlay
 * after 9 s whatever happens.
 *
 * Fill modes: an entrance is `fill: "both"` (its first frame shows during its
 * delay). An animation that TAKES OVER an element an earlier one already
 * moved must be `"forwards"`, or its first frame freezes the element from
 * time zero.
 */

export type SplashRuntime = {
 biteAt: number;
 openAt: number;
 openMs: number;
 reducedHoldMs: number;
 loadTimeoutMs: number;
 sessionKey: string;
 disableKey: string;
 skipPaths: readonly string[];
 images: readonly string[];
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
 const ready = Promise.all(
 C.images.map((src) => {
 const img = new Image();
 img.src = src;
 return img.decode();
 }),
 );

 let overlay: HTMLElement | null = null;
 let started = false;
 const t0 = Date.now();

 (function find() {
 const el = document.getElementById("app-splash");
 // The HTML streams in; wait for the whole overlay, not just its opening tag.
 if (el && el.querySelector('[data-sp="end"]')) {
 overlay = el;
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
 // The layers have just been decoded, so these come straight from cache.
 root.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((img) => {
 img.src = img.dataset.src!;
 });
 html.setAttribute("data-splash-ran", "");
 setState("run");
 const one = (k: string) => root.querySelector<HTMLElement>(`[data-sp="${k}"]`)!;
 const finish = (a: Animation) =>
 a.finished.then(
 () => setState("done"),
 () => setState("done"),
 );

 if (reduce) {
 root.setAttribute("data-reduced", "");
 root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "both" });
 setTimeout(() => {
 setState("out");
 finish(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "both" }));
 }, 220 + C.reducedHoldMs);
 return;
 }

 const W = innerWidth;
 const H = innerHeight;
 const OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
 const BASE = "translate(-50%, -50%)";
 const go = (el: Element, frames: Keyframe[], delay: number, duration: number, easing = "linear", fill: FillMode = "both") =>
 el.animate(frames, { delay, duration, easing, fill });

 const night = one("night");
 const halo = one("halo");
 const words = one("words");
 const tile = one("tile");
 const cap = one("cap");
 const sheen = one("sheen");

 // 0–350: the tile eases in out of a slight blur; its light comes up.
 go(
 tile,
 [
 { opacity: 0, transform: `${BASE} scale(0.9)`, filter: "blur(6px)" },
 { opacity: 1, transform: `${BASE} scale(1)`, filter: "blur(0px)" },
 ],
 0,
 350,
 OUT,
 );
 go(halo, [{ opacity: 0 }, { opacity: 0.55 }], 0, 350, OUT);

 // 100–600: the cap drops in from above the tile (which clips it), lands
 // with a bounce and the tassel swings it a little before it settles.
 go(
 cap,
 [
 { opacity: 1, transform: "translate(-6%, -150%) rotate(-28deg)", easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
 { opacity: 1, transform: "translate(0, 0) rotate(0deg)", offset: 0.62, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
 { opacity: 1, transform: "translate(0, -9%) rotate(5deg)", offset: 0.78, easing: "cubic-bezier(0.5, 0, 0.7, 1)" },
 { opacity: 1, transform: "translate(0, 0) rotate(-2deg)", offset: 0.9 },
 { opacity: 1, transform: "translate(0, 0) rotate(0deg)" },
 ],
 100,
 500,
 );
 // ~410: it lands — the tile gives a little bump.
 go(
 tile,
 [{ transform: `${BASE} scale(1)` }, { transform: `${BASE} scale(1.03)`, offset: 0.4 }, { transform: `${BASE} scale(1)` }],
 410,
 170,
 "ease-out",
 "forwards",
 );

 // 520–860: a sheen catches the tile; the name and the tagline rise in.
 go(sheen, [{ transform: "translateX(-120%)" }, { transform: "translateX(120%)" }], 520, 340, "cubic-bezier(0.45, 0, 0.2, 1)");
 go(words, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], 520, 300, OUT);

 // The bite: a big circle at the top-right corner and two smaller scallops
 // along the top and right edges (px centres; the radii animate).
 const R = Math.min(W, H) * 0.2;
 const c1 = [W - 0.15 * R, 0.15 * R];
 const c2 = [W - 1.35 * R, -0.05 * R];
 const c3 = [W + 0.05 * R, 1.35 * R];
 [c1, c2, c3].forEach(([x, y], i) => {
 night.style.setProperty(`--sp-x${i + 1}`, `${x}px`);
 night.style.setProperty(`--sp-y${i + 1}`, `${y}px`);
 });
 // Big enough to clear the far (bottom-left) corner.
 const S = Math.hypot(c1[0], H - c1[1]) / R + 0.15;
 const bite = (k: number) => ({ "--sp-r1": `${R * k}px`, "--sp-r2": `${R * 0.55 * k}px`, "--sp-r3": `${R * 0.55 * k}px` });
 const canGrow = typeof CSS !== "undefined" && typeof CSS.registerProperty === "function";

 // biteAt: CHOMP — the bite snaps out of the corner; the tile flinches.
 go(night, [bite(0), bite(1)], C.biteAt, 80, "cubic-bezier(0.3, 0, 0.2, 1.3)");
 go(
 tile,
 [
 { transform: `${BASE} scale(1)` },
 { transform: `${BASE} scale(0.96) rotate(-2deg)`, offset: 0.4 },
 { transform: `${BASE} scale(1)` },
 ],
 C.biteAt,
 150,
 "ease-out",
 "forwards",
 );

 // openAt: the bite opens across the screen onto the app; the name and the
 // light fade; the tile glides into the page's own logo.
 if (canGrow) {
 go(night, [bite(1), bite(S)], C.openAt, C.openMs, "cubic-bezier(0.65, 0, 0.35, 1)", "forwards");
 } else {
 go(night, [{ opacity: 1 }, { opacity: 0 }], C.openAt, C.openMs - 80, "ease-in", "forwards");
 }
 go(words, [{ opacity: 1 }, { opacity: 0, transform: "translateY(-6px)" }], C.openAt, 150, "ease-in", "forwards");
 go(halo, [{ opacity: 0.55 }, { opacity: 0 }], C.openAt, 180, "ease-in", "forwards");

 setTimeout(() => {
 setState("out");
 // Measured now, once the page underneath has had a second to render.
 const target = document.querySelector("[data-splash-target]");
 const r = target ? target.getBoundingClientRect() : null;
 const tr = tile.getBoundingClientRect();
 if (r && r.width > 0 && r.bottom > 0 && r.top < H) {
 const dx = r.left + r.width / 2 - (tr.left + tr.width / 2);
 const dy = r.top + r.height / 2 - (tr.top + tr.height / 2);
 // The size from layout, not the rect: the bite's flinch is still scaling it.
 const k = r.width / tile.offsetWidth;
 finish(
 tile.animate(
 [
 { transform: `${BASE} scale(1)`, borderRadius: "24%", easing: "cubic-bezier(0.55, 0, 0.15, 1)" },
 { transform: `${BASE} translate(${dx}px, ${dy}px) scale(${k})`, borderRadius: "33%", opacity: 1, offset: 0.92 },
 { transform: `${BASE} translate(${dx}px, ${dy}px) scale(${k})`, borderRadius: "33%", opacity: 0 },
 ],
 { duration: C.openMs, fill: "forwards" },
 ),
 );
 } else {
 finish(
 tile.animate(
 [
 { opacity: 1, transform: `${BASE} scale(1)` },
 { opacity: 0, transform: `${BASE} scale(0.6)` },
 ],
 { duration: C.openMs, easing: "ease-in", fill: "forwards" },
 ),
 );
 }
 }, C.openAt + 20);
 }
}
