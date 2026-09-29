// Runs before first paint (a raw inline <script> at the top of <body> in
// layout.tsx) so a stored "dark" or "system"+OS-dark preference applies
// before first paint, with no flash of the light theme. Must stay in sync
// with the defaults/logic in ./store.ts (this can't import that module —
// it has to be a standalone string Next.js inlines into <head>).
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var v = localStorage.getItem("mutebites.theme");
    var pref = (v === "light" || v === "dark" || v === "system") ? v : "system";
    var dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  } catch (e) {}
})();
`;
