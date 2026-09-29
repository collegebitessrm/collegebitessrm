// Contrast audit over the token pairs the app actually uses, read straight
// from src/app/globals.css (:root and .dark), with alpha compositing.
// Run: npm run audit:contrast — exits non-zero if any pair fails.
import fs from 'node:fs';
const css = fs.readFileSync('src/app/globals.css', 'utf8');
// Every top-level block for this selector (:root appears more than once).
const block = (sel) => {
  const re = new RegExp(`\\n${sel.replace('.', '\\.')} \\{([\\s\\S]*?)\\n\\}`, 'g');
  const out = {};
  for (const m of css.matchAll(re))
    for (const x of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[x[1]] = x[2].trim();
  return out;
};
const themes = { light: block(':root'), dark: { ...block(':root'), ...block('.dark') } };

const parse = (v) => {
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  m = v.match(/^rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)$/);
  if (m) return [+m[1], +m[2], +m[3], +m[4] / 100];
  throw new Error('cannot parse ' + v);
};
const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
const alpha = (c, a) => [c[0], c[1], c[2], c[3] * a];
const lum = (c) => { const v = c.slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// [label, fg token, fg alpha, bg stack (bottom first, [token, alpha]), min]
const T = (t, a = 1) => [t, a];
const checks = [
  ['body text on ground', 'foreground', 1, [T('background')], 4.5],
  ['body text on card', 'foreground', 1, [T('card')], 4.5],
  ['muted text on ground', 'muted-foreground', 1, [T('background')], 4.5],
  ['muted text on card', 'muted-foreground', 1, [T('card')], 4.5],
  ['muted text on secondary chip', 'muted-foreground', 1, [T('secondary')], 4.5],
  ['muted text on popover', 'muted-foreground', 1, [T('popover')], 4.5],
  ['search placeholder (muted on secondary)', 'muted-foreground', 1, [T('secondary')], 4.5],
  ['amber text (prices/links) on ground', 'primary', 1, [T('background')], 4.5],
  ['amber text on card', 'primary', 1, [T('card')], 4.5],
  ['button text on amber', 'primary-foreground', 1, [T('primary')], 4.5],
  ['rose cuisines on card', 'rose', 1, [T('card')], 4.5],
  ['rose cuisines on ground (menu sheet)', 'rose', 1, [T('background')], 4.5],
  ['blush chip text', 'brand-soft-foreground', 1, [T('brand-soft')], 4.5],
  ['success text on success-soft chip', 'success', 1, [T('success-soft')], 4.5],
  ['success text on card', 'success', 1, [T('card')], 4.5],
  ['destructive text on card', 'destructive', 1, [T('card')], 4.5],
  ['destructive text on destructive/10 over card', 'destructive', 1, [T('card'), T('destructive', 0.1)], 4.5],
  ['destructive text on destructive/5 over card (outlined buttons)', 'destructive', 1, [T('card'), T('destructive', 0.05)], 4.5],
  ['text on success fill', 'success-foreground', 1, [T('success')], 4.5],
  ['text on destructive fill', 'destructive-foreground', 1, [T('destructive')], 4.5],
  ['ink text on ink', 'ink-foreground', 1, [T('ink')], 4.5],
  ['ink text/75 on ink (secondary lines)', 'ink-foreground', 0.75, [T('ink')], 4.5],
  ['ink text/75 ("/5" in admin)', 'ink-foreground', 0.75, [T('ink')], 3.0],
  ['ink-accent on ink', 'ink-accent', 1, [T('ink')], 4.5],
  ['ink-success on ink', 'ink-success', 1, [T('ink')], 4.5],
  ['ink-danger on ink', 'ink-danger', 1, [T('ink')], 4.5],
  ['ink-danger on ink-foreground/10 over ink (Pause ordering)', 'ink-danger', 1, [T('ink'), T('ink-foreground', 0.1)], 4.5],
  ['ink text on ink-success fill (Turn ordering on)', 'ink', 1, [T('ink-success')], 4.5],
  ['ink text on ink-foreground/10 chip over ink', 'ink-foreground', 1, [T('ink'), T('ink-foreground', 0.1)], 4.5],
  ['frosted chip text (muted on card/90 over ink-ish photo)', 'muted-foreground', 1, [T('ink'), T('card', 0.9)], 4.5],
  ['success on frosted chip (card/90 over dark photo)', 'success', 1, [T('ink'), T('card', 0.9)], 4.5],
  ['amber button vs ground (non-text, 3:1)', 'primary', 1, [T('background')], 3.0],
  ['input border vs card (non-text, 3:1 — WCAG 1.4.11)', 'input', 1, [T('card')], 3.0],
  ['focus ring (ring/80) vs card (non-text, 3:1)', 'ring', 0.8, [T('card')], 3.0],
];

let fails = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n== ${name}`);
  for (const [label, fg, fa, stack, min] of checks) {
    let bg = [255, 255, 255, 1];
    for (const [tok, a] of stack) bg = over(alpha(parse(t[tok]), a), bg);
    const fgc = over(alpha(parse(t[fg]), fa), bg);
    const r = ratio(fgc, bg);
    const ok = r >= min;
    if (!ok) fails++;
    console.log(`${ok ? '  ok ' : 'FAIL '} ${r.toFixed(2).padStart(5)}  (min ${min})  ${label}`);
  }
}
console.log(`\n${fails} failing pair(s)`);
process.exitCode = fails ? 1 : 0;
