import { DEFAULT_PALETTE, PALETTE_GROUNDS } from "./palettes";

// Runs before first paint (a raw inline <script> at the top of <body> in
// layout.tsx) so a stored "dark" or "system"+OS-dark preference, and the
// chosen palette (data-palette), apply before first paint, with no flash
// of the default theme. Must stay in sync with the defaults/logic in
// ./store.ts (this can't import that module — it has to be a standalone
// string Next.js inlines into the page; the palette grounds are
// interpolated from ./palettes.ts, which has no imports).
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var root = document.documentElement;
    var v = localStorage.getItem("collegebites.theme");
    var pref = (v === "light" || v === "dark" || v === "system") ? v : "system";
    var dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }
    var grounds = ${JSON.stringify(PALETTE_GROUNDS)};
    var p = localStorage.getItem("collegebites.palette");
    if (!Object.prototype.hasOwnProperty.call(grounds, p)) p = "${DEFAULT_PALETTE}";
    root.setAttribute("data-palette", p);
    var bar = grounds[p][dark ? "dark" : "light"];
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", bar);
  } catch (e) {}
})();
`;
