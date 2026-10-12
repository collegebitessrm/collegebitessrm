// Runs before first paint (a raw inline <script> at the top of <body> in
// layout.tsx) so a stored "dark" or "system"+OS-dark preference applies
// before first paint, with no flash of the default theme.
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
 var bar = dark ? "#1c1c1c" : "#ffffff";
 var metas = document.querySelectorAll('meta[name="theme-color"]');
 for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", bar);
 } catch (e) {}
})();
`;
