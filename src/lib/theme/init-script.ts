// Runs before first paint (a raw inline <script> at the top of <body> in
// layout.tsx) so a stored "dark" or explicit choice applies before first paint,
// with default being "light" theme.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var root = document.documentElement;
    var v = localStorage.getItem("collegebites.theme");
    var pref = (v === "light" || v === "dark" || v === "system") ? v : "light";
    var dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    var bar = dark ? "#1c1c1c" : "#ffffff";
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", bar);
  } catch (e) {}
})();
`;
