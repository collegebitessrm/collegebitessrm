// Contrast audit over the token pairs the app actually uses, read straight
// from src/app/globals.css, with alpha compositing — for every palette
// (Vice Dusk, Electric Sunrise, Innovation Hub, Kaapi) in light and dark.
// Run: npm run audit:contrast — exits non-zero if any pair fails, or if a
// palette block is missing a token the default one defines (a missing token
// would leak another palette's value through the cascade).
import fs from 'node:fs';
const css = fs.readFileSync('src/app/globals.css', 'utf8');
// Every top-level block whose selector list is exactly `sel` (a list may be
// split over lines after its commas).
const block = (sel) => {
  const head = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/, /g, ',\\s*');
  const re = new RegExp(`\\n${head} \\{([\\s\\S]*?)\\n\\}`, 'g');
  const out = {};
  for (const m of css.matchAll(re))
    for (const x of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[x[1]] = x[2].trim();
  return out;
};
const viceLight = block(':root, [data-palette="vice"]');
const viceDark = block('.dark, .dark [data-palette="vice"]');
// Same order as the cascade in the browser: default light < default dark <
// palette light < palette dark (see the comment above the palettes).
const themes = { 'vice light': viceLight, 'vice dark': { ...viceLight, ...viceDark } };
const required = Object.keys(viceLight).filter((k) => k !== 'radius');
let missing = 0;
for (const pal of ['sunrise', 'hub', 'kaapi']) {
  const light = block(`[data-palette="${pal}"]`);
  const dark = block(`.dark[data-palette="${pal}"], .dark [data-palette="${pal}"]`);
  for (const [mode, b] of [['light', light], ['dark', dark]]) {
    const gaps = required.filter((k) => !(k in b));
    if (gaps.length) {
      missing += gaps.length;
      console.log(`MISSING in ${pal} ${mode}: ${gaps.join(', ')}`);
    }
  }
  themes[`${pal} light`] = { ...viceLight, ...light };
  themes[`${pal} dark`] = { ...viceLight, ...viceDark, ...light, ...dark };
}

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
  // Ground, cards and wells
  ['body text on ground', 'foreground', 1, [T('background')], 4.5],
  ['body text under the page sky (both glows)', 'foreground', 1, [T('background'), T('page-glow-b'), T('page-glow-a')], 4.5],
  ['body text on card', 'foreground', 1, [T('card')], 4.5],
  ['body text on popover', 'foreground', 1, [T('popover')], 4.5],
  ['muted text on ground', 'muted-foreground', 1, [T('background')], 4.5],
  ['muted text under the page sky', 'muted-foreground', 1, [T('background'), T('page-glow-b'), T('page-glow-a')], 4.5],
  ['muted text on card', 'muted-foreground', 1, [T('card')], 4.5],
  ['muted text on secondary well / chip', 'muted-foreground', 1, [T('secondary')], 4.5],
  ['muted text on popover', 'muted-foreground', 1, [T('popover')], 4.5],
  // Actions: the gradient pill runs --primary -> --primary-2
  ['button text on primary (gradient start)', 'primary-foreground', 1, [T('primary')], 4.5],
  ['button text on primary-2 (gradient end)', 'primary-foreground', 1, [T('primary-2')], 4.5],
  ['primary as text (links) on ground', 'primary', 1, [T('background')], 4.5],
  ['primary as text on card', 'primary', 1, [T('card')], 4.5],
  ['primary text on primary/10 over card (admin pills)', 'primary', 1, [T('card'), T('primary', 0.1)], 4.5],
  ['primary pill vs ground (non-text, 3:1)', 'primary', 1, [T('background')], 3.0],
  ['selected chip text', 'chip-active-foreground', 1, [T('chip-active')], 4.5],
  ['Non-veg chip on (destructive on destructive/10 over the ground)', 'destructive', 1, [T('background'), T('destructive', 0.1)], 4.5],
  ['Filters count badge (chip-active text on its foreground)', 'chip-active', 1, [T('chip-active-foreground')], 4.5],
  ['status chip: text on gold/35 over card (Placed, Preparing)', 'foreground', 1, [T('card'), T('gold', 0.35)], 4.5],
  ['status chip: aqua on chip-active/20 over card (Confirmed)', 'aqua', 1, [T('card'), T('chip-active', 0.2)], 4.5],
  ['"Rate your order" pill: dusk on gold', 'hero-foreground', 1, [T('gold')], 4.5],
  ['campus-pass stat label (hero text on its /10 tile over magenta)', 'hero-foreground', 1, [T('hero-c'), T('hero-foreground', 0.1)], 4.5],
  ['campus-pass initials / rank pill (coral on dusk)', 'hero', 1, [T('hero-foreground')], 4.5],
  ['bottom-bar tab label (muted on card/85 over the ground)', 'muted-foreground', 1, [T('background'), T('card', 0.85)], 4.5],
  // Accent text
  ['aqua text (cuisines) on card', 'aqua', 1, [T('card')], 4.5],
  ['aqua text on ground', 'aqua', 1, [T('background')], 4.5],
  ['aqua text on secondary well', 'aqua', 1, [T('secondary')], 4.5],
  ['pink-soft chip text', 'pink-soft-foreground', 1, [T('pink-soft')], 4.5],
  ['gold-strong marks (stars) vs card (non-text, 3:1)', 'gold-strong', 1, [T('card')], 3.0],
  // Taste profile: avatar tiles (the other tones reuse pairs checked here) and
  // the "Finish your profile" card's progress ring
  ['avatar icon on the aqua tile', 'aqua-foreground', 1, [T('aqua')], 4.5],
  ['avatar icon on the gold tile', 'hero-foreground', 1, [T('gold')], 4.5],
  ['avatar icon (coral) on the campus-pass dusk circle', 'hero', 1, [T('hero-foreground')], 4.5],
  ['progress ring (primary) on popover (non-text, 3:1)', 'primary', 1, [T('popover')], 3.0],
  // The heart on a dish photo: a frosted card/90 chip over a dark or a bright photo
  ['heart, filled (primary) on its chip over a dark photo (non-text, 3:1)', 'primary', 1, [T('hero-foreground'), T('card', 0.9)], 3.0],
  ['heart, filled (primary) on its chip over a bright photo (non-text, 3:1)', 'primary', 1, [T('hero-a'), T('card', 0.9)], 3.0],
  ['heart, empty (muted) on its chip over a bright photo (non-text, 3:1)', 'muted-foreground', 1, [T('hero-a'), T('card', 0.9)], 3.0],
  // Status
  ['success text on success-soft chip', 'success', 1, [T('success-soft')], 4.5],
  ['success text on card', 'success', 1, [T('card')], 4.5],
  ['success text on secondary well (admin order box: offer line)', 'success', 1, [T('secondary')], 4.5],
  ['success text on ground (cart sheet: discount line)', 'success', 1, [T('background')], 4.5],
  ['offer switch knob (card) on primary track (non-text, 3:1)', 'card', 1, [T('primary')], 3.0],
  ['destructive text on card', 'destructive', 1, [T('card')], 4.5],
  ['destructive text on destructive/10 over card', 'destructive', 1, [T('card'), T('destructive', 0.1)], 4.5],
  ['destructive text on destructive/5 over card (outlined buttons)', 'destructive', 1, [T('card'), T('destructive', 0.05)], 4.5],
  ['text on success fill', 'success-foreground', 1, [T('success')], 4.5],
  ['text on destructive fill', 'destructive-foreground', 1, [T('destructive')], 4.5],
  // The sunset hero (gold -> coral -> magenta): every stop
  ...['hero-a', 'hero-b', 'hero-c'].flatMap((stop) => [
    [`hero text on ${stop}`, 'hero-foreground', 1, [T(stop)], 4.5],
    [`hero secondary text (/85) on ${stop}`, 'hero-foreground', 0.85, [T(stop)], 4.5],
    [`hero-accent on ${stop}`, 'hero-accent', 1, [T(stop)], 4.5],
    [`hero-success on ${stop}`, 'hero-success', 1, [T(stop)], 4.5],
    [`hero-danger on ${stop}`, 'hero-danger', 1, [T(stop)], 4.5],
    [`hero text on hero-foreground/10 chip over ${stop}`, 'hero-foreground', 1, [T(stop), T('hero-foreground', 0.1)], 4.5],
    [`hero-danger on hero-foreground/10 over ${stop} (Pause ordering)`, 'hero-danger', 1, [T(stop), T('hero-foreground', 0.1)], 4.5],
    [`hero-success power icon on its /20 chip over ${stop} (non-text, 3:1)`, 'hero-success', 1, [T(stop), T('hero-success', 0.2)], 3.0],
    [`hero-danger power icon on its /20 chip over ${stop} (non-text, 3:1)`, 'hero-danger', 1, [T(stop), T('hero-danger', 0.2)], 3.0],
  ]),
  ['coral text on the dusk segment (admin switch)', 'hero', 1, [T('hero-foreground')], 4.5],
  ['coral text on hero-success fill (Turn ordering on)', 'hero', 1, [T('hero-success')], 4.5],
  // Frosted chips on photos: a dark photo (dusk) and a bright one (gold)
  ['frosted chip text (muted on card/90 over a dark photo)', 'muted-foreground', 1, [T('hero-foreground'), T('card', 0.9)], 4.5],
  ['frosted chip text (muted on card/90 over a bright photo)', 'muted-foreground', 1, [T('hero-a'), T('card', 0.9)], 4.5],
  ['success on frosted chip (card/90 over a dark photo)', 'success', 1, [T('hero-foreground'), T('card', 0.9)], 4.5],
  // Controls
  ['input border vs card (non-text, 3:1 — WCAG 1.4.11)', 'input', 1, [T('card')], 3.0],
  ['focus ring (ring/80) vs card (non-text, 3:1)', 'ring', 0.8, [T('card')], 3.0],
  ['focus ring (ring/80) vs ground (non-text, 3:1)', 'ring', 0.8, [T('background')], 3.0],
  // Gradient headline text (text-sunset): every stop, on the ground and under the sky
  ...['heading-a', 'heading-b', 'heading-c'].flatMap((stop) => [
    [`${stop} headline on ground`, stop, 1, [T('background')], 4.5],
    [`${stop} headline under the page sky`, stop, 1, [T('background'), T('page-glow-b'), T('page-glow-a')], 4.5],
  ]),
  // Sign-in sheet (card/85, frosted over the sky or the dark sea): the
  // tagline in text-sunset and the muted lines. Dusk stands in for the sea.
  ...['heading-a', 'heading-b', 'heading-c'].flatMap((stop) => [
    [`${stop} tagline on the sign-in sheet (card)`, stop, 1, [T('card')], 4.5],
    [`${stop} tagline on the sheet over the dark sea`, stop, 1, [T('hero-foreground'), T('card', 0.85)], 4.5],
  ]),
  ['muted text on the sign-in sheet over the dark sea', 'muted-foreground', 1, [T('hero-foreground'), T('card', 0.85)], 4.5],
  ['muted text on the sign-in sheet over the bright sky', 'muted-foreground', 1, [T('hero-a'), T('card', 0.85)], 4.5],
  // Home header sky at its strongest point for each time of day — the plain
  // greeting and every stop of a gradient heading
  ...['morning', 'afternoon', 'evening', 'night'].flatMap((m) => [
    [`Home greeting on ${m} sky`, 'foreground', 1, [T('background'), T(`mood-${m}-b`), T(`mood-${m}-a`)], 6.7],
    [`Home time-of-day line (muted) on ${m} sky`, 'muted-foreground', 1, [T('background'), T(`mood-${m}-b`), T(`mood-${m}-a`)], 4.5],
    ...['heading-a', 'heading-b', 'heading-c'].map((stop) => [
      `${stop} Home heading on ${m} sky`, stop, 1, [T('background'), T(`mood-${m}-b`), T(`mood-${m}-a`)], 4.5,
    ]),
  ]),
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
console.log(`\n${fails} failing pair(s), ${missing} missing token(s)`);
process.exitCode = fails || missing ? 1 : 0;
