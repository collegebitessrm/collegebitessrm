@AGENTS.md

# College Bites

Food delivery site for SRM University AP (Amaravati, Andhra Pradesh)
students. Tagline: "Crave. Click. Campus." Pickup at **Gate 3**; support
(call + WhatsApp) +91 99899 55833 (`src/lib/support.ts`); admin alerts to
collegebitessrm@gmail.com (`ADMIN_ALERT_EMAILS`). The name is "College
Bites" everywhere; "SRM" only shows in small places (site title, About
popup footer, admin header, privacy/terms) — keep it that way. Live at
https://collegebitessrm.vercel.app.

Launched 1 Oct 2026. Three partner restaurants (Triangle Food Court,
Local Home Kitchen, Clg Bites Biryani Nation), cash on delivery, Google
sign-in only. Ordering is a plain **Open / Closed** switch the admin flips —
there is no daily schedule — and each restaurant promises delivery within
its own `delivery_minutes` (40, or 60 for Biryani Nation).

Redesigned on 30 Sep 2026 in 11 steps: the Vice Dusk × Leonida Gold
palette and lighting kit, Poppins + Inter, Phosphor duotone icons, the
floating bottom bar, the sunset sign-in scene, the Home filter, and new
menu / cart / pickup pass / campus pass / overlay designs. Summary in
`docs/BLUEPRINT.md` §7; the details are in the sections below.

Working rules: never change the database without showing the SQL first
(see the hard rule at the bottom); migrations are applied through the
Supabase connector (project `cpatbcisnrvyjztyqutq`, `ap-south-1`) after
approval. Commit as `collegebitessrm <collegebitessrm@gmail.com>` (set
repo-locally) — Vercel's Hobby plan refuses to build commits by any other
author.

## Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (`src/components/ui`)
- **Design tokens** (`src/app/globals.css`): the **Vice Dusk × Leonida
  Gold** palette — a hybrid of GTA Vice City and GTA VI, built around
  *light* rather than flat swatches: a deep blue-violet dusk ground, neon
  that glows (Ocean Drive magenta `#FF2E88`, Keys cyan `#22DDEB` — the
  logo's teal switched on), a sunset that bleeds gold `#FFB557` → coral
  `#FF6A5B` → magenta `#FF3D93`, and electric violet `#7A28E8` as the far
  edge of the sky. Light mode is the same scene at golden hour: sand ground
  `#FFF5EE`, white cards with warm coral-tinted shadows, lilac wells
  `#F6EEFF`, deep text `#1A0F3D`. Dark ("dusk"): `#0E0A24` → card
  `#1A1238` → raised `#251A4E`, text `#FFF0F6`, with a 1px rim light baked
  into the card elevation. The brand sheet (`docs/design-reference.webp`)
  still sets the logo and the layout ideas; its palette was replaced.
  Roles: actions are the `surface-primary` gradient pill over `bg-primary`
  (`--primary` → `--primary-2`: magenta → violet with white text in light,
  neon → tangerine with dusk text in dark; the shadcn `Button` default does
  the same); selected chips/tabs are `bg-chip-active
  text-chip-active-foreground` (cyan); `text-aqua` for cuisines/info,
  `text-primary` for links, `--gold` / `--gold-strong` for stars and
  highlights (gold is never text on light). The hero surfaces (`bg-hero` +
  `surface-hero`: pickup pass, campus pass, cart bar, promo, banners, admin
  Today card, celebration) are the sunset gradient with **dusk text in both
  themes** — secondary lines at `text-hero-foreground/85` or stronger, and
  full strength for small text on a /10 tile (fainter fails
  on the magenta end), accents `text-hero-accent` / `-hero-success` /
  `-hero-danger`. **Lighting kit** (use it, so nothing looks flat):
  `glow-neon` / `glow-cyan` / `glow-sun` bloom shadows, `rim-light`,
  `text-sunset` gradient headline text (used ONLY on the Home greeting —
  everywhere else headings and totals are solid, by decision 1 Oct 2026) (every stop checked on its ground,
  `--heading-a|b|c`), and a two-glow sky over the top of every page (body
  background, `--page-glow-*`). Restraint: one bloom per screen region —
  the main action or the hero; everything else gets rim light and tinted
  shadows. Fixed 5-step ramps (`night-`/`pink-`/`aqua-`/`sunset-`/
  `gold-`/`violet-`/`sand-`/`forest-`/`brick-` 100–900, plus `coral-500`)
  sit alongside semantic tokens that flip per theme — prefer the semantic
  ones. Text on a coloured fill uses its `*-foreground` token, never
  `text-white`. `bg-pink-soft text-pink-soft-foreground` is the pink tint.
  Photos never get tints or overlays. Tapping the Appearance toggle
  cross-fades the theme (a root view transition in
  `src/lib/theme/store.ts`; instant under reduced motion). Focus rings are
  `ring-ring/80` and input borders use `--input` — both meet WCAG's 3:1
  for non-text UI. `npm run audit:contrast` (`scripts/contrast-audit.mjs`)
  re-checks every token pair in both themes of every palette — both ends of the action
  gradient, every hero stop, every heading gradient stop on the ground,
  under the page sky and over each Home mood — and fails if any pair is
  below its minimum. Run it after touching colours, and add a pair for any
  new text/surface combination.
- **Themes (palettes)** — four, picked per device in Profile → Theme and
  on the first-login form (`/welcome`, "Pick a theme" with the Light / Dark
  / System switch, between the phone field and the Gate 3 note — not part
  of the form data, it applies the moment it's tapped) (`PalettePicker`,
  `src/components/theme/palette-picker.tsx`), each a
  complete light + dark token set in `globals.css`, independent of the
  Light / Dark / System switch, listed in this order in the picker:
  **Electric Sunrise** — **the default** for new students and any device
  that hasn't picked one (`DEFAULT_PALETTE` in `palettes.ts`, interpolated
  into the theme-init script; the viewport `theme-color` and the manifest
  use its cream `#FFF8F0` / charcoal `#1A1A1D`) — then **Vice Dusk** (`vice`
  — the palette described above, the GTA VI theme: its picker caption is
  "GTA VI themed · Gamers special"; the theme's name stays Vice Dusk),
  **Innovation Hub** and **Kaapi**. In detail: **Electric Sunrise** (`sunrise`: cream, purple `#6A0DAD`
  actions, neon peach chips, a gold-dust → peach → lilac hero, tech-blue
  info, midnight-green veg; dark is charcoal `#1A1A1D` with magenta-bloom
  actions `#E264FF` — the brief's `#D500F9` lifted to pass as link text),
  **Innovation Hub** (`hub`: mint-white `#F3F8F8`, purple actions, tech-blue
  chips, a blue → lilac → coral hero; dark is navy `#122238` with electric
  lime `#32CD32` → aqua actions) and **Kaapi** (`kaapi`: cream `#F6EEE3`,
  coffee → cinnamon actions with cream text, rose-milk chips, a turmeric →
  caramel → rose-milk hero, teal info; dark is espresso `#1C120D` with
  turmeric → rose-milk actions). `data-palette` on `<html>` is set before
  first paint by the theme-init script and kept by `setPalette()` /
  `usePalette()` (`src/lib/theme/store.ts`, localStorage
  `collegebites.palette`, same cross-fade as Light/Dark); names, blurbs and
  each palette's ground live in `src/lib/theme/palettes.ts` (the ground
  also drives the browser-bar `theme-color`, retargeted at runtime). The
  palette blocks key on the attribute alone, so it works on ANY element —
  the picker's preview cards set `data-palette` on themselves and render
  with that palette's real tokens. Specificity: `[data-palette="x"]` ties
  with `.dark`, so a palette's light block also overrides Vice dusk in dark
  mode and its dark block (`.dark[data-palette="x"]`) then wins — so **every
  palette block must define every token** Vice's `:root` block does; the
  contrast audit fails on a missing one and checks all 8 sets. Everything
  that used to be a fixed Vice colour is now a per-palette token:
  `--scrim` (dialog backdrops, `bg-scrim/50`), `--shadow-ink` (an rgb
  triplet inside the glow utilities), `--food-ring` (a colour list),
  `--promo-sun-a/-b`, `--confetti-1…6`, `--splash-glow-a/-b`; the sign-in
  scene's sky / sun / sea / palms are variables on `.login-sky`, set per
  palette and mode in `login.css`. Adding a palette = a light and a dark
  block in `globals.css`, a scene pair in `login.css`, an entry in
  `palettes.ts`, and a row in the audit's palette list. The share card and
  manifest use Electric Sunrise, the default (they aren't per student).
  **Each palette has its own look, not just its own colours** — the sunset
  is Vice's alone. `--hero-surface` (read by `surface-hero`) gives each hero
  card its own light: Vice a 135° sunset lit top-left; Sunrise a dawn glow
  rising from the bottom edge crossed by two light ribbons; Hub two glows
  (blue top-left, coral bottom-right) over lilac on a fine white grid;
  Kaapi a warm top-to-bottom coffee wash with crema light. Decoration comes
  from `ThemeMotif` (`src/components/theme/theme-motif.tsx`) wherever the
  striped sun used to be (campus pass, free-biryani card, admin
  Today card, About strip, 404 card, celebration, the picker's previews):
  Vice the striped retro sun (`promo-sun`); Sunrise a line-art sun rising
  with rays and twinkling sparkles; Hub orbit rings, a triangle of linked
  nodes (one pulsing) and chevrons; Kaapi a filter-coffee tumbler in its
  davara with rising steam and two beans. All four are in the markup; the
  nearest `data-palette` shows one through the `only-vice` / `only-sunrise`
  / `only-hub` / `only-kaapi` utilities (`display: var(--show-<id>)` — a
  custom property, so it follows the NEAREST palette, which a plain
  `[data-palette] .x` selector can't). The celebration's rotating rays
  (`sunburst`) are `only-vice`. Motion (`motif-twinkle`, `motif-steam`,
  `motif-pulse`) lives in the reduced-motion-safe block.
- **Typography**: Poppins (`font-heading`, weights 500/600/700 only — it
  isn't a variable font) for display text and big numerals (tabular
  figures via a base rule); Inter (`font-sans`, variable) for body **and
  buttons** — buttons never use `font-heading`. Both from `next/font` in
  `src/app/layout.tsx`. Sizes above body come from the named scale in
  `globals.css` — `text-display` (hero), `text-headline` (page titles),
  `text-title` (card/section titles) — not one-off `text-[2.5rem]`s.
  They're registered as font sizes in `cn` (`src/lib/utils.ts`); add any
  new named size there too, or `cn()` drops it next to a text colour.
  Small captions above fields/sections use `text-label`: sentence case,
  sans, no letter-spacing. No mono font is loaded; don't bring back the
  mono-uppercase eyebrow style, and no `uppercase` anywhere.
- **Home header mood field**: `HomeHeader` bleeds to the screen edges over
  `.mood-field.mood-<morning|afternoon|evening|night>` (`globals.css`),
  driven by `getTimeOfDayIST()`. Each mood has three `--mood-<time>-a/b/c`
  stops per theme (Leonida sunrise gold/peach, Vice beach cyan haze,
  golden-hour tangerine → magenta, neon-night violet), checked by the
  contrast audit at ≥6.7:1 for the plain greeting and ≥4.5:1 for every
  `text-sunset` stop on top — re-run it if you change them.
- **Order tracking — the pickup pass**: the token card
  (`order-tracking.tsx`) is a sunset `surface-hero` pass (no tear line or
  notches any more) — up to three distinct photos of the ordered dishes on
  top, then the token (text-6xl, share button), the delivery window and a
  "Collect at Gate 3 · pay on delivery" pill, and while the order is live
  a footer strip with `DeliveryRoad` (`src/components/orders/delivery-road.tsx`):
  the road from the kitchen (chef's hat) to Gate 3 (pin) with Phosphor's
  `Moped` riding along it WITH THE CLOCK: position = time since placing ÷
  the restaurant's `delivery_minutes`, re-read every 15 s, bounded per
  status by `RANGE` [floor, ceiling] — pending 6–20% (it can't ride far
  before the restaurant confirms), confirmed / preparing 20–94%, out for
  delivery 50–94% (running late, it waits just short of the gate),
  delivered 100% → a tick. Before the first tick (and on the server) it
  sits at the floor, so hydration matches. The covered stretch is lit, a
  one-line status message is `aria-live`, and Realtime status changes move
  it live (CSS transition on `left` / `width` via a `--p` custom property). The Orders list's in-progress card reuses it
  (`tone="card"`, no message). The step list sits in a card below the
  pass. `statusBadge()` (`src/lib/orders/status.ts`, shared with admin)
  uses the brand sheet's colours: Placed / Preparing gold, Confirmed cyan,
  Out for delivery pink, Delivered green, Cancelled red. `deliveryWindow(createdAt, minutes)`
  (`src/lib/date.ts`) returns `{ lead, time }` — "Delivery by" the placed
  time plus the restaurant's `delivery_minutes` (40 by default, Biryani
  Nation 60) — with no-break spaces inside `time`, so "8:15 PM" can never
  wrap apart. `deliveryDue()` / `isPastDeliveryTime()` are the same
  promise as a Date / a check. Once delivered, the ticket page also carries the
  rating card (`RateOrder`, see `order_reviews`).
- **Campus pass details per palette** (`PassArt`,
  `src/components/theme/pass-art.tsx`): Vice keeps its striped sun in the
  card's corner; the other three get a small animated detail at the top
  right (beside the "campus pass" label, above the name, never behind text)
  with a soft glow — Kaapi a tumbler with rising steam, Sunrise a small sun
  with breathing rays and twinkling sparkles, Hub satellites orbiting a
  pulsing node (`motif-rays` / `motif-orbit` in the reduced-motion-safe block).
- **Profile look**: `MemberCard` is the "campus pass" — a sunset
  `surface-hero` card with the palette's `ThemeMotif` in the corner, the student's avatar
  (`tone="ink"`) in a dusk circle inside a turning `food-ring` (tapping it
  opens "Your taste"), the rank pill (coral on dusk)
  and three lit stat tiles (full-strength dusk text; /85 fails on the
  magenta end). Milestone tiles: unlocked = a gradient circle with a gold
  duotone icon and `animate-shine` (a light band sweeping across now and
  then); locked = a sunset-gradient progress ring (SVG `linearGradient`
  with a per-milestone id, `ring-<key>`). `MilestoneReward`: a pink card
  with a sunset "N to go" bar until everything's unlocked, then a lit
  sunset card with a "Claim it on WhatsApp" pill (until an admin marks it
  claimed). Details and settings rows lead with `IconTile`
  (`src/components/icon-tile.tsx`, shared with the cart); Edit buttons are
  pink pills (primary text on the lilac well is just under 4.5:1, so it's
  avoided).
- **Profile**: one sunset `MemberCard` (`src/components/profile/member-card.tsx`)
  holds identity, the weekly-rank pill and the three stats (cravings
  solved, day streak, no-shows). Milestones are data-driven in
  `MILESTONES` (`milestone-badges.tsx`) — six tiers, all computed from
  counts that only go up (delivered orders, distinct restaurants), so a
  badge never re-locks; locked tiles show a progress ring and "N to go".
  Under the grid, a blush `MilestoneReward` card carries the client's
  offer: all six milestones = one free biryani of their choice. Earned →
  a WhatsApp link (`SUPPORT_PHONE`) with a prefilled claim message; once
  an admin marks it handed over on `/admin/users` (`milestone_rewards`,
  `setMilestoneRewardClaimed()`) the card says "Free biryani claimed".
  The admin row's "Mark claimed" (confirm dialog, with Undo) only appears
  for students who've unlocked every milestone, computed server-side in
  `getAllUsers()` with the same `getUnlockedMilestones()`; a "Free biryani
  earned" chip filters the list to them.
  A newly unlocked milestone (per device, `collegebites.milestones-seen`)
  plays the same full-screen celebration as "Order placed!" — both use
  `CelebrationOverlay` (`src/components/celebration-overlay.tsx`: sunset
  hero overlay, confetti unless reduced motion, the chime, tap or ~2 s to
  dismiss); several at once share one overlay naming them all. Render it
  outside any `<ViewTransition>`.
- **Taste profile and avatars** (`public.taste_profiles`, see the schema
  below; `src/lib/taste/`, `src/components/taste/`): every student has an
  avatar — one of 12 preset Phosphor food icons (`AVATARS` in
  `src/lib/taste/options.ts`: biryani pot (the default, `pot`), noodle bowl,
  chilli, egg, pizza, burger, chai, ice cream, cookie, carrot, orange,
  popcorn) on a round tile lit in a palette tone (`Avatar`,
  `src/components/taste/avatar.tsx`), no uploads — plus three questions:
  spice 1–5 (Mild … Extra spicy), diet (Veg / Egg is fine / Non-veg; no
  vegan or Jain — the menus can't honour them) and cravings (any of Home's
  `FOOD_TYPES`). One "Your taste" bottom sheet per page (`TasteSheetHost`
  on Home and Profile) is opened through `src/lib/taste/sheet-store.ts` by
  the Home header avatar, the campus-pass avatar, Profile's "Your taste"
  row (`tasteSummary()`, e.g. "Medium · Veg · Biryani, Noodles") and the
  nudge; it saves everything in one `saveTasteProfile()` upsert
  (`src/lib/taste/actions.ts`, `revalidatePath("/", "layout")`).
  `getTasteProfile()` (`src/lib/data/taste.ts`, request-cached) returns the
  defaults when there's no row. What the answers do: cravings come first in
  "What's on your mind?" (`RestaurantList`'s `cravings`); spice 1–2 / 5
  offers a one-tap "Less spicy please" / "Extra spicy please" chip under
  the cart's notes box (`spiceNote()`, passed from Home and the menu
  through `CartBar` → `CartSheet`) — never typed in for them. The
  **"Finish your profile"** card (`FinishProfileNudge`) floats above the
  bottom bar on Home once the student has placed an order
  (`hasPlacedOrder()`) and hasn't answered all three (`answeredCount()`),
  after the splash plus ~1.8 s; "Later" hides it for 3 days, × for good,
  and saving in the sheet also snoozes it (localStorage
  `collegebites.taste-nudge`); it hides while the cart bar or the sheet is
  showing.
  **Hearts** (`favorite_dishes`, see the menu's `DishCard`) build on it:
  `getLikedDishes()` (`src/lib/data/favorites.ts`, request-cached, newest
  first) → `heartCravings()` (food types the hearted dishes match, most
  first). Home's tiles go `cravingOrder()` — stated cravings, then those;
  the sheet marks them with a small heart ("From your hearts") while no
  cravings are picked — never selected for them. Profile shows a
  **"Liked dishes"** row (`LikedDishes`,
  `src/components/profile/liked-dishes.tsx`: photo cards → `?dish=` deep
  link, sold-out greyed, an empty hint) between the milestones and "Your
  details". The Campus favourites row ignores hearts on purpose. It sits on `z-30` like the cart bar and the bottom bar: Home's
  sticky filter chips are `z-20` and come later in the page, so a floating
  layer on `z-20` gets painted under them (it did, on 1 Oct). Floating bars
  `z-30`, sticky bars `z-10`/`z-20`, dialogs and sheets `z-50`, toasts
  `z-[100]`.
- **404 / error pages**: `src/app/not-found.tsx` ("Token #404"),
  `src/app/error.tsx` and a self-contained `src/app/global-error.tsx`. The
  first two use `WrongTurn` (`src/components/wrong-turn.tsx`): a small
  tilted hero card (with the palette's motif) — the big label (#404 / Oops), a note, and the order
  road's scooter stopped facing back with a "?" over it (flipped with CSS
  `scale`, since the bob animation would override the icon's own
  `mirrored` transform). It replaced the MuteBites-era `LostTicket` stub.
  This Next.js version passes `retry` (not `reset`) to error boundaries.
  `getRestaurantMenu()` / `getOrder()` return null for a malformed id
  (`isUuid()`, `src/lib/ids.ts`), so a mangled URL is a 404 rather than a
  Postgres error. Empty states go through `EmptyState`
  (`src/components/empty-state.tsx`): `art="plates"` for empty cart /
  orders (the plates pop in one after another), an icon on a pink tile for
  in-place no-match states.
- **Overlays and toasts**: dialogs and alert dialogs sit over a dusk
  (`bg-night-900/50`) blurred backdrop, rounded 2rem / 1.75rem with a
  border, alert buttons are pills. The About dialog has a strip of the
  palette's hero with its motif and the logo rising out of it.
  `CelebrationOverlay` is the palette's hero (`surface-hero`) with its
  motif rising from the bottom — plus slowly turning light rays
  (`sunburst`) for Vice Dusk only. Toasts are popover pills with a green /
  red icon disc. Skeletons shimmer with a warm coral band.
- **Icons**: Phosphor, **duotone** by default (outline + a soft fill
  layer, like the brand sheet's two-tone icons), always imported from
  `src/components/icons.tsx` — never from `@phosphor-icons/react`
  directly. That file maps the app's icon names (kept from the lucide
  era, so `Utensils` is Phosphor's `ForkKnife`, `Loader2` its
  `CircleNotch`, `MessageCircle` the WhatsApp logo) to Phosphor's SSR
  build, one import per icon: it works in server and client components,
  and only used icons ship (Next doesn't optimise Phosphor's barrel file).
  Defaults: 24px, aria-hidden unless labelled, plain glyphs (Plus, X,
  arrows, carets, Check) bold. Need a new icon → add a line to the `MAP`
  there. `lucide-react` is uninstalled; a shadcn component added later
  must have its icon imports switched to `@/components/icons`. Two
  utilities restyle the fill layer (`globals.css`): `icon-solid` makes it
  opaque (filled stars — use it instead of `fill-*` classes, which don't
  fill a duotone icon) and `icon-tint-<colour>` paints it a palette colour
  (`icon-tint-gold` on the Campus favourites flame, reward gift, unlocked
  milestones and rating prompts; `icon-tint-primary` on the Gate 3 pin).
  Rating stars are `icon-solid text-gold-strong`. Active tabs use
  `weight="fill"`. No emoji anywhere in the UI (they render differently
  per OS and clash with the icon set). Big moments get
  `CelebrationOverlay`, not an emoji-laden toast.
- **Home layout** (`src/app/(home)/page.tsx`, `src/components/home/`): the
  header over the time-of-day sky (logo → About, the WhatsApp channel
  button, the student's avatar → the "Your taste" sheet; a small
  gold-lit time-of-day line, "Hey, <first name>" as the h1 in
  `text-sunset`, then that hour's question), the pill search, then —
  hidden while searching — `PromoCard` (hero card: "Hot food, at Gate 3" + "Order here, pay when
  you collect." on the left; on the right the brand sheet's scene — the
  palette's own campus (`public/photos/promo/scene-<palette>.webp`, all four
  cropped to the same 1476×906 box so the overlays line up) and a 9 s
  delivery run on a loop with the shared rider (`rider.webp`): it pulls in,
  idles (engine buzz), rides the road's S-bend up to the campus — the route
  is the road's lane dashes measured in scene percentages (`promo-route`,
  identical on all four scenes), shrinking with distance and flipping to
  face the way it rides after the bend (`promo-rider`), with speed lines
  only while moving and a dust puff as it pulls away — rides into the gate,
  and the Gate 3 pin on the tower door pops, rings and bursts. Every part
  shares one clock (same duration + delay) so they stay in step. One touch
  per palette: Vice stars and Sunrise sparkles twinkle, Hub's node pulses,
  Kaapi's food box steams. CSS only (`promo-*` in `globals.css`; reduced
  motion shows the rider parked at the foot of the road, still; paused
  while the splash is up); hidden palettes' scenes are never fetched (lazy
  + `only-*`). Sources were 1536×1024 ChatGPT PNGs, converted to ~50 KB WebP)
  and `PopularRail`: a snap-scrolling row of
  photo cards that deep-link to the dish, titled "Campus favourites".
  `buildRail()` puts the week's real trending dishes first (#1/#2 badges,
  available and with a photo), then fills the row to 8 with the
  restaurants' signature dishes interleaved (`getSignatureDishes()` in
  `dish-photos.ts`, no repeats) — only trending dishes get a rank badge,
  so a signature dish is never labelled as trending. This row replaced the
  old Trending popup (flame button in the header), removed 1 Oct 2026.
  Then "Restaurants near campus" with `RestaurantCard`s: photo slides,
  name (h3) and area with a pin, cuisine chips in aqua plus a
  `delivery_minutes` chip ("40 min"), a glowing arrow, and a footer with
  the dish count and "from ₹X" in pink. No star ratings (reviews are
  admin-only). The first card's cover loads eagerly at high priority (it's
  the page's biggest image).
- **Sign-in page** (`src/app/login/`): `LoginScene` (`login-scene.tsx` +
  `login.css`): real dishes floating in a sky over the palette's own scene
  (`only-*` layers): **Vice Dusk** keeps the Vice City sunset described
  here; **Electric Sunrise** a line-art sun rising on the horizon with rays,
  twinkling sparkles and drifting gold / peach / lilac ribbons in place of
  the sea; **Innovation Hub** a dot grid fading down the sky, a network of
  glowing nodes, orbit rings on the horizon and drifting coral / violet
  bands (lime nodes and edge at night); **Kaapi** a filter-coffee tumbler in
  its davara on a wooden table (sized by the sky's height, like the dishes),
  steam rising, coffee beans drifting. Vice Dusk's scene is — golden hour in light mode, neon dusk
  with stars in dark: a striped retro sun half set behind the horizon, a
  violet sea with drifting wave lines and a sun reflection, two inline-SVG
  palm silhouettes, and three real dish photos floating as tilted prints.
  A solid sheet (`bg-card`, no frosted glass since 1 Oct 2026) rises over the bottom of it with
  the logo tile, the tagline h1 in `text-primary`, two chips (free delivery
  to Gate 3, pay on delivery — cash or UPI), Google's own white "Continue
  with Google" button (grey `#747775` outline on light, cyan glow) and the
  terms line. Motion (sun rise, sway, drift, twinkle, staggered
  `login-rise`) is all under `no-preference`; the h1 is `login-settle` (a
  10 px rise, never invisible) because an element first painted at opacity
  0 isn't counted as Largest Contentful Paint — with everything fading in,
  Lighthouse / Search Console found no LCP on this page at all, and pauses while the startup
  splash still covers the page (`html[data-splash=play|run]`), so the sun
  rises as the splash fades. The `/welcome` form uses the same sunset as
  one `surface-hero` header card.
- **Bottom bar** (`TabBar`, `src/components/nav/tab-bar.tsx`): mounted once
  in the **root layout**, not per page, so it stays alive across tab
  changes and its lit pill (`surface-primary glow-neon`) slides — with a
  spring and a squash as it lands — to the tapped tab while the new icon
  pops in filled (`animate-tab-pop` / `animate-tab-stretch`). It shows on
  exactly `/`, `/orders` and `/profile`; on drill-down screens
  (`/restaurants/*`, `/orders/*`) it slides down and is `inert`; elsewhere
  it renders nothing. Tapping the current tab scrolls to the top.
  It's also a real slider: press anywhere on the bar and slide sideways
  (past 8px) — the pill lifts and follows the finger 1:1 (pointer capture),
  the tab under it lights up with a tiny `navigator.vibrate` buzz where
  supported, and release snaps to that tab and `router.push`es it; the
  click that follows a drag is swallowed. `touch-action: pan-y` keeps
  vertical page scrolling; plain taps and keyboard links work as before.
  The tab under the finger is computed in the pointer handlers (the
  React compiler lint forbids measuring refs during render). Floating
  (`rounded-full bg-card/85` with blur), so pages keep `pb-28`; the Home
  `CartBar` (`hasTabBar`) sits just above it. Don't add `<TabBar />` to a page.
- **Dish deep links**: `/restaurants/<id>?dish=<dishId>` opens the menu
  scrolled to that dish with a brief rose outline (`focusDishId` in
  `MenuView`). Used by Home search's dish results, the Campus favourites row and
  the Thursday banner (`getThursdaySpecial()` returns `dishId`).
- **Home search** searches dishes as well as restaurants: every dish ships
  with the page (`getSearchableDishes()`, ~100 rows) and `searchDishes()`
  (`src/lib/search.ts`) filters on the client — every typed word must start
  a word in the dish name, its category or its restaurant's name, in any
  order. "veg" / "non veg" filter on the dish's veg flag instead of text
  (so "veg" never matches inside "Non-Veg Biryani"). Results show in the
  same dish grid as the filters below (sold-out and closed-kitchen dishes
  stay in while searching, greyed / last); restaurants also appear if they
  serve a match.
- **WhatsApp channel** (`WHATSAPP_CHANNEL_URL` in `src/lib/support.ts`,
  added 4 Oct 2026; `src/components/channel/`): `ChannelPopover`, a round
  WhatsApp button left of the Home header avatar. Tapping it opens a Base
  UI popover card (`z-50`) that grows out of the button's corner with a
  spring (`.channel-pop`, transitions on Base UI's
  `data-starting-style` / `data-ending-style`, origin
  `--transform-origin`) and its rows rise in one by one (`.channel-rise`,
  `--i` stagger): a hero strip with the palette's motif, the WhatsApp logo
  and "College Bites", three perks (offers and free biryani drops, when we
  open and close, new dishes), a "Follow on WhatsApp" action pill
  (`target="_blank"`) and "Your number stays private". Until the card is
  opened once on the device (`collegebites.wa-channel-seen`, a
  `useSyncExternalStore` store in `channel-seen.ts`; server snapshot =
  seen, so nothing flashes) the button carries a pulsing dot and wiggles
  twice after the splash (`.channel-wiggle`, paused under the splash). All
  motion is in the no-preference block. Also findable from a
  `ChannelCard` row on Profile (under "Need help?") and a "Follow our
  WhatsApp channel" pill in the About dialog. The channel's own name is
  "College Bites - SRM"; on the site it's just "College Bites".
- **Home filter** (Swiggy / Zomato style; `src/lib/home-filters.ts` +
  `src/components/home/`): all on the device over the dishes Home already
  ships — no new query. `FoodTypeRail` ("What's on your mind?"): round
  photo tiles for `FOOD_TYPES` (Biryani, Fried rice, Noodles, Starters,
  Chicken, Paneer, Egg, Mushroom — matched on dish name + section, a dish
  can be in several; only types with something orderable show; tile photos
  are literal paths there), chosen tile ringed by a turning `food-ring`.
  `FilterBar`: sticky chips — Filters (count badge) and Sort open
  `FilterSheet`; Veg / Non-veg (one or the other, non-veg red like the
  menu), Under ₹200, `FAST_MINUTES` (40) delivery, and Popular (only once
  `POPULAR_MIN` = 3 dishes have 3+ orders in 30 days). `FilterSheet`
  (bottom sheet) edits a draft — sort (Recommended = most ordered first,
  price up/down, fastest), diet, price bands, restaurants, 40-min, popular,
  show sold-out — with a live "Show N dishes" button that applies it.
  Browsing hides dishes from switched-off restaurants and sold-out ones.
  State lives in the URL (`?type=biryani&diet=veg&sort=price-asc…`,
  `parseFilters` / `serializeFilters`, unknown values ignored), written
  with `window.history.replaceState` (Next syncs `useSearchParams`; no
  server round-trip), so Back from a dish restores the filters. While
  searching or filtering, the promo and photo row give way to `DishGrid`
  (two-column photo cards → `?dish=` deep link, 12 at a time) and the
  restaurants serving something in it; changing filters while scrolled
  past the sticky chips scrolls the results up to meet them.
- **Menu filters** (`MenuView`, `src/components/menu/menu-view.tsx`): one
  sticky row — search icon, then a scrolling rail of **Veg** / **Non-veg**
  (mutually exclusive, tap again to clear; red on light red for non-veg)
  and the category chips. The diet toggles only appear on a menu that has
  both kinds of dish.
- **Menu and cart look**: the menu's cover photo is untinted; the sheet
  rising over it carries the name, area, chips (cuisines, "Delivery in N
  min" from `delivery_minutes`, "Free to Gate 3") and `MenuProgress` — a
  sunset bar that fills from empty on first paint (`.progress-fill`,
  `@starting-style`) with "N to go". Section headings get their food icon
  on a pink tile (`getCuisineIcon`, passed in as a prop — the React
  compiler lint rejects components picked during render) and a count pill.
  `DishCard` has a heart in the photo's top-right corner (`HeartButton`,
  `src/components/menu/heart-button.tsx`): fills at once with a pop and a
  10 ms buzz, saves through `setDishLiked()` (`src/lib/favorites/actions.ts`)
  in the background, reverts with a toast if that fails. The action does
  **not** `revalidatePath` — in this Next.js a revalidating action re-renders
  the current page in the same round trip, i.e. the whole menu per tap —
  so the button remembers taps for the session (module-level `TAPPED`)
  and a Back to a cached menu still shows the right heart; Profile and Home
  are dynamic and read fresh. The top-left tag is capped short of the
  heart. **Portions** (`src/lib/menu/portions.ts`): dishes named
  "<name> (Single)" / "<name> (Full)" (Biryani Nation), and "<name>" +
  "<name> (White)" (Local Home Kitchen: the plain dish is "Regular", the
  sheet asks "Choose a style" — `pickerPrompt()`), are grouped by
  `groupPortions()` into ONE card — base name, both prices ("Single ₹220 ·
  Full ₹310"), one photo, one heart (the first portion's) — whose "+" (or
  the in-cart count with a chevron) opens `PortionSheet`
  (`portion-sheet.tsx`): a row per portion with its own Add / stepper, sold-out
  rows disabled, "Done". Each portion is still its own dish underneath (id,
  price, cart line, order item, `place_order()`), so nothing server-side
  changed; the cart line shows the base name plus a "Single" / "Full" chip
  (`splitPortion()`); `?dish=` links to either portion land on the card;
  section counts count cards. A new sized dish just needs that naming. `DishCard`'s add control is ONE lit pill that widens from a round "+"
  into the "− n +" stepper (`transition-[width]`, `ease-spring`) and
  shrinks back; it only glows (`glow-neon`) once the dish is in the cart,
  and keyboard focus follows it. Prices are pink (`text-primary`). In the
  cart sheet: tinted icon tiles for Gate 3 and the contact number, a
  "Free" chip, the total in `text-sunset`, and a pill "Place order" that
  shimmers while placing. Main actions across the app are now rounded-full
  pills (the brand sheet's buttons), not rounded-2xl blocks.
- **Notifications** (web push, `src/lib/notifications/`): students get
  *confirmed*, *delivered* and *cancelled*; the address in
  `ADMIN_ALERT_EMAILS` (`send.ts`) gets *new order*. `public/sw.js` is a
  notifications-only service worker — **no fetch handler on purpose**, so
  it can never serve a stale page. `client.ts` registers it, asks
  permission and saves the subscription (`actions.ts` → the
  `push_subscriptions` table); `send.ts` delivers with `web-push` and
  deletes rows a push service reports as gone (404/410). Sends run inside
  `after()` so a slow push service never holds up an order or a status
  change, and never throw. Student sends go through the admin's own
  session (admins can read every subscription row); the *new order* send
  can't (a student's session can't see the admin's devices), so it uses
  the service-role client (`src/lib/supabase/admin.ts` — the only place
  that key is used; missing key = no admin push, everything else fine).
  Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. UI: a switch in Profile, a one-time
  "Get a ping" card on a live order (`collegebites.notify-asked`), and
  `NewOrderAlerts` on the dashboard — Realtime `orders` inserts play a
  **loud** repeating alarm (`playAdminAlertSound()`, its own
  `collegebites.admin-alert-sound` switch, deliberately not the student
  chime), count new orders and refresh the list. Browsers block audio
  until a real tap, so the bell both grants permission and arms the sound.
  A push notification's *own* sound is the phone's setting, not ours —
  admin pushes only set `requireInteraction` and a long vibrate.
- **Motion**: CSS only (no Framer Motion). Easing tokens `--ease-out-expo`
  / `--ease-spring` / `--ease-in-quad` (also Tailwind `ease-*` utilities) and
  durations `--dur-press|quick|base|slow` in `globals.css` — use them rather
  than hand-typed curves. New animations go inside the existing
  `prefers-reduced-motion: no-preference` block; a reduce-motion safety net
  at the bottom collapses anything else (library animations included) to
  its end state, spinners exempt. The global press rule transitions colour
  and shadow as well as transform on purpose — it's unlayered, so a bare
  `transition: transform` there would override every `transition-colors`.
  Shared-element view transitions (card → menu hero) were considered and
  skipped: the menu has a `loading.tsx`, so the pair rarely forms.
- **Backend**: Supabase (Postgres + Auth + Row Level Security)
- **Auth**: "Continue with Google" via Supabase Auth (Google OAuth
  provider). Sign-out is `scope: "local"` (this device only; the default
  "global" logged students out everywhere). No email/password, no OTP. On first login (no matching
  `public.users` row yet), the app collects full name + mobile number
  (and offers the theme picker, saved on the device only) before
  continuing; returning users skip straight in.
- **Payments**: Pay on delivery only (the site says "Pay on delivery —
  cash or UPI") — there are no payment fields or
  payment provider anywhere in this codebase. Don't add any. The "About
  College Bites" popup (see below) also mentions UPI as accepted at pickup —
  that's real, but purely physical, an informal option between the runner
  and student handled entirely outside the app, the same as cash; it's
  not tracked, processed, or reconciled by anything here, so it doesn't
  contradict the rule above. Don't build actual UPI integration (a QR
  code, a payment record, verification) without this being revisited
  first — that would be a real payment provider, which this app
  deliberately doesn't have.
- **Hosting**: Vercel. `vercel.json` pins the serverless function region to
  `bom1` (Mumbai) to match the Supabase project's `ap-south-1` region —
  Vercel's default function region is US-East, and without the pin every
  DB/auth call crosses from Virginia to Mumbai and back (2–3 s pages).
  Pages also read the session once per request (`src/lib/profile.ts`
  uses `getSession()`; the proxy already verified it with `getUser()`).
  If Supabase's region ever changes, update this to match.
  Every push to `main` auto-deploys (usually ~30 s). The Hobby plan
  allows 100 deployments a day and builds one at a time, so batch small
  follow-up fixes into one push rather than pushing each tweak. The Vercel
  CLI works via `npx -y vercel@latest` (`ls collegebitessrm`, `inspect <url>
  --logs`, `redeploy <url>`) once logged in as the collegebitessrm Vercel
  account (`npx -y vercel@latest login`). Hobby keeps runtime logs for
  about an hour only. A deploy stuck on
  "Initializing" with no build logs has, so far, been a Vercel-side
  incident — check https://www.vercel-status.com before redeploying (a
  redeploy just queues behind it).

## Admin access

`/admin` has two layers, both required, neither optional:
1. `requireAdmin()` (`src/lib/admin/guard.ts`) — signed in via Google, and
   `users.role = 'admin'` (see Database schema below for how that's set).
2. A separate passcode, checked in `src/app/admin/layout.tsx` after (1)
   passes. The passcode lives only in the `ADMIN_PASSCODE` env var —
   never hardcoded, never committed. Entering it right sets an httpOnly,
   `/admin`-scoped session cookie holding an HMAC of the admin's user id
   keyed by the passcode, never the passcode itself (`src/lib/admin/passcode.ts` /
   `passcode-actions.ts`); no `ADMIN_PASSCODE` set means the gate **fails
   closed** — nobody gets in, admin role or not — rather than silently
   letting everyone through.

The main `/admin` dashboard's list is **Current orders**: today's (IST)
orders until their promised delivery time (`deliveryDue()`: placed +
the restaurant's `delivery_minutes`), after which a delivered/cancelled
order drops off; pending/confirmed ones stay until they're done, so
nothing actionable disappears (`getAdminOrders()`). `RefreshAt`
re-fetches the page the moment the next one passes. The stat
cards still count the whole day (`getOrderCounts(startOfTodayIST())`).
Every order ever placed lives
at `/admin/history` instead, grouped by day (newest first), reusing the
same `OrderList` component in a `groupByDate` mode rather than a separate
one-off component. Every registered student is browsable (read-only, with
a client-side search box) at `/admin/users`, reached via a "Users" button
next to "Order history" (a third button, "Reviews", opens `/admin/reviews` —
see `order_reviews` under Database schema). Banned users management lives
on its own page, `/admin/banned`, reached via a "Banned users" button on
`/admin/users`, and its back-link points to `/admin/users` (`BackToDashboardLink` takes optional
`href`/`label` overrides for this).

**Offers** (`/admin/offers`, an "Offers" pill on the dashboard next to
"Sold out" with an "N on" chip while any is on; the switches are
`OffersCard`, `src/components/admin/offers-card.tsx`): three switches, any mix on —
**10% off**, **20% off** and **Buy 3 Full biryanis, get 1 Single free** —
saved straight to `app_settings.offer_pct10 | offer_pct20 | offer_biryani`
by `setOfferEnabled()` (`src/lib/admin/actions.ts`, admin-checked, RLS the
boundary). While any is on, the cart sheet shows an **Apply discount** bar
(`DiscountPicker`, `src/components/cart/discount-picker.tsx`): the live
offers as a radio group, **one per order, never stacked**, each with what it
saves. **All three are Biryani Nation only** (by decision, 4 Oct 2026:
`OFFER_RESTAURANT_ID` in `src/lib/offers.ts`; `place_order()` checks the
same id and raises `offer_wrong_restaurant`, which the cart treats like an
ended offer) — other restaurants' carts list them greyed out, "Only at Clg
Bites Biryani Nation". 10% / 20% come off the paid items (rounded to the rupee). The
biryani offer only works where dishes are named "… Biryani (Full)" /
"… Biryani (Single)" (Biryani Nation): one free Single per 3 paid Fulls in
the same order, the student picks which Single(s); the cart's item total
adds the free Single at its menu price and the same amount comes off, so
the student pays exactly the paid lines (never subtract the free value
from the paid lines alone — that was the 4 Oct bug) — elsewhere, or with too
few Fulls, it shows why it's unavailable ("Add 2 more Full biryanis to
unlock"). No per-student limit: every order while it's on (by decision).
The rules live in `src/lib/offers.ts` for the cart's numbers and in
`place_order()` for real — change them together. `getOffers()`
(`src/lib/data/offers.ts`) feeds Home, menus (via `MenuView` → `CartBar` →
`CartSheet`) and the dashboard. Every order view shows the offer line and
free items ("Free" / "(free)"): ticket, admin card and detail, WhatsApp
and copy text (`offerLine()`), CSV export (Offer + Discount columns). A
free biryani is left out of "Your usual" (`usual.ts`) so a re-order never
adds it as paid.

**Sold out** (`/admin/sold-out`, a "Sold out" pill on the dashboard) lists
every dish on every menu — including the ones already off sale, since this
is the only way to put one back — grouped by restaurant and section, with
restaurant tabs, a search box and a "Sold out only" filter. Each row's
button flips `dishes.is_available` via `setDishAvailable()`
(`src/lib/admin/actions.ts`, admin-checked like every other admin action,
with RLS as the real boundary) and updates that row in place. A sold-out
dish still shows on the student menu — greyed, struck through and
unorderable (`DishCard`'s `soldOut`) — and `place_order()` refuses it
anyway, so the flag is never only a UI state.

**Admin app (PWA)**: the admin layout links its own manifest,
`/admin.webmanifest` (`src/app/admin.webmanifest/route.ts`, static): name
"College Bites Admin", short name "CB Admin", `id` / `scope` / `start_url`
`/admin`, the same icons — so it installs as a second app beside the
student one and opens on the dashboard. It sits outside `/admin` and is
excluded from the `src/proxy.ts` matcher: browsers fetch manifests without
cookies, so behind the sign-in redirect it would come back as HTML. The
header's **Install** pill (`InstallAppButton`,
`src/components/admin/install-app-button.tsx`; state in
`src/lib/pwa/install-store.ts`, a `useSyncExternalStore` store whose
`beforeinstallprompt` listener registers at module load so the one-shot
event isn't missed) opens Chrome / Edge's install dialog, or on iPhone /
iPad a dialog with the Share → Add to Home Screen steps; it's hidden when
running standalone, after `appinstalled`, or where installing isn't
offered. The service worker (`/sw.js`, scope `/`) covers it for push.

Visually, admin shares the student app's system: the dashboard's sunset
"Today" card (`StatCards`) carries today's counts with the campus ordering
control (`OrderingKillSwitch` — a two-way Open / Closed switch for
`app_settings.ordering_mode`, with a confirm dialog each way) as its
footer row; secondary actions use the
shared `adminPill` style (`src/components/admin/styles.ts`); order cards
lead with the token and a dish photo; restaurant controls show cover
photos; no uppercase anywhere.

Order cards carry a "From <restaurant>" box: one line per dish as
"Dish name - qty" with its price — never "1× Dish" — then the note, then
the student's name and number. The WhatsApp button's message and the copy
button's text come from `src/lib/orders/admin-text.ts` (WhatsApp: full
name; restaurant, each dish and the question on their own lines; a total
line only for multi-dish orders. Copy: number, name, then restaurant
and each dish (contact on top since 4 Oct 2026) — no token or times; for Triangle Food Court and Local Home Kitchen
(`COPY_WITH_PRICES`, by restaurant id, 4 Oct 2026) each dish also carries
its price — "Dish - 2 (₹240)" — plus the offer and total lines, exactly as
in the WhatsApp text; Biryani Nation's copy stays price-free) — keep them
in step with the card.
Tapping a card opens **`/admin/orders/[id]`** (`getAdminOrderDetail()` +
`OrderDetailView`): timing (placed, delivery window, delivered at),
student (phone, reg. number, email, Call / WhatsApp / Copy), each dish
with unit price, subtotal and the student's stars if rated, total, note,
review note, and the same Confirm / Mark delivered / Cancel actions
(`OrderActions`, shared with the card). The card is clickable via a
stretched link on the token (`after:inset-0`); its buttons sit above it
with `relative z-10` — keep new controls on the card above it too.

Setting ordering to **Closed** also turns every restaurant off
(`setOrderingMode`); reopening leaves them off. Tapping "Turn on" on a
restaurant while Closed asks "Open ordering now?" — yes sets Open and
turns that restaurant on. While Closed, admin restaurant cards that are
still on show an amber "Paused" chip.

"Mark all delivered" acts on **every** confirmed order, any day, not just
today's list (`getConfirmedOrderCount()` for the label, the same set
`markAllConfirmedDelivered()` delivers); it's only disabled, with "No
confirmed orders to deliver", when there are none. Base UI gotcha: put `disabled` on the
`AlertDialogTrigger`/`DialogTrigger` itself, never on the element passed
to its `render` prop — the trigger merges its own `disabled: false` last and
silently re-enables the button.

## Project structure

- `docs/CLIENT-GUIDE.md` — the plain-English guide for the College Bites
  team (admin access, open/close ordering, handling orders, sold out,
  bans, rewards). Keep it in step when an admin flow or label changes.
- `docs/design-reference.webp` — the client's brand sheet: the logo and
  layout reference (its palette was replaced by Vice Dusk × Leonida Gold).
- `docs/BLUEPRINT.md` — the whole project in one place: setup outside
  the code (Supabase, Google, Vercel, GitHub), architecture, business
  rules, every migration, lessons learned and what's still open. Update it
  alongside this file when something significant changes.
- `src/app` — routes (App Router)
- `src/app/robots.ts` — generates `/robots.txt` (everything but `/admin`
  crawlable). Excluded from the `src/proxy.ts` matcher like `favicon.ico`,
  otherwise the sign-in guard 307s crawlers to `/login` and Lighthouse
  marks robots.txt invalid.
- **SEO** (search basics only — signed-out visitors, and so search
  engines, can only load `/login`, `/privacy` and `/terms`; menus are not
  public, by decision): `src/lib/site.ts` holds the site address
  (`NEXT_PUBLIC_SITE_URL` overrides it — set that if a custom domain is
  added), name, search title and description. The root layout sets
  `metadataBase`, description, keywords, Open Graph / Twitter tags and
  Google Search Console verification (`GOOGLE_SITE_VERIFICATION` env var,
  nothing emitted while unset). `src/app/opengraph-image.tsx` renders the
  link-preview card (mark, name, tagline, four dish photos — literal
  paths, update them if a photo is renamed) with `ImageResponse`, then
  re-encodes it as a JPEG with `sharp` (~106 KB; the PNG was ~930 KB, too
  big for WhatsApp to preview reliably). `sharp` is a declared dependency
  for this. `/login` carries the full
  search title, a canonical URL and Organization/WebSite JSON-LD.
  `src/app/sitemap.ts` lists the three public pages; `robots.ts` points
  to it and disallows `/admin`, `/auth`, `/orders`, `/profile`,
  `/welcome`, which (plus the admin layout) are also `noindex`.
  `sitemap.xml` and `opengraph-image` are excluded from the
  `src/proxy.ts` matcher so bots aren't redirected to `/login`.
- Every page has exactly one `<h1>` (order tracking's is `sr-only`; the
  admin header's "Admin" is an h1 only on the dashboard itself, since
  sub-pages carry their own). Keep it that way when adding pages.
- `src/app/privacy`, `src/app/terms` — static, unauthenticated pages
  required for the Google OAuth consent-screen review. Listed in
  `PUBLIC_PATHS` (`src/lib/supabase/middleware.ts`) alongside `/login` and
  `/auth` so `src/proxy.ts` doesn't bounce a signed-out visitor — or
  Google's review bot — to `/login` before they can load them.
- `src/app/(home)/page.tsx` — the `/` route. It lives in a `(home)` route
  group (the parens don't affect the URL) specifically so its
  `loading.tsx` stays scoped to just `/`. A `loading.tsx` placed directly
  in `src/app` would become the fallback for *every* route that doesn't
  have its own — including `/login`, `/admin`, etc. — since the app root
  is an ancestor of all of them. Don't move `page.tsx` back out to
  `src/app` without either dropping its `loading.tsx` or being fine with
  that.
- `src/components/ui` — shadcn/ui components. Two modal-style primitives:
  `alert-dialog.tsx` (confirmations — "Cancel this order?", "Pause
  ordering campus-wide?", "Mark 3 orders delivered?") and `dialog.tsx`
  (plain popups with no confirm/cancel semantics — the "About College Bites"
  card from the Home logo and the one-time "How was
  it?" rating prompt). The cart and rating sheets use `sheet.tsx`. Both wrap `@base-ui/react`; reach for whichever already matches
  what you're building rather than hand-rolling a third.
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (Server Components/Actions)
- `src/lib/supabase/middleware.ts` — session-refresh helper used by
  `src/proxy.ts` — this Next.js version renamed `middleware.ts`/
  `middleware()` to `proxy.ts`/`proxy()`; same route-matcher config,
  different filename and export name.
- `supabase/migrations/` — hand-written SQL migrations (see rule below)
- `public/photos/dishes/` — dish photos (one file per dish kind, shared by
  every restaurant and size that serves it) and `public/photos/covers/` —
  restaurant hero banners — matched to database rows by name
  in `src/lib/data/dish-photos.ts`, deliberately **not** a database column
  (no schema change needed to add or swap a photo). `getRestaurantCoverPhoto()`
  and `getDishPhoto()` look up by exact restaurant/dish name; anything
  without a confident match — a dish with no distinct photo, a restaurant
  with no cover yet — falls back to the existing flat placeholder
  (`bg-stripes`) rather than showing a mismatched image. Keep source
  photos at most ~1200px on the long side and a few hundred KB (four
  1.3–2.6 MB originals were re-encoded to that in place, same pictures):
  Vercel's optimiser resizes on first request, and a multi-MB source
  makes that first load visibly slow. A photo that's
  replaced after publishing gets a new filename (e.g. a `-v2` suffix) — an intermediate cache (outside this app, never fully
  identified) kept re-serving an old file by its original URL even after
  verified-fresh server responses and full dev-server restarts, so a
  changed photo should get a new filename, not overwrite the old one
  in place, to guarantee cache-safety.
  The sign-in scene's floating dishes (`src/app/login/login-scene.tsx`,
  `CARDS`) and `EmptyState`'s plates also reference these files by path directly — renaming or
  removing a photo means updating that list too, or its tile goes blank.
  Home's restaurant cards slide through photos (`RestaurantPhotoSlides`,
  `src/components/home/restaurant-photo-slides.tsx`): the cover first,
  then up to five available dishes with a "veg mark · name · price" chip
  (`getRestaurantCardSlides()`, same file as above) — most ordered
  first (campus-wide, last 30 days: `getDishOrderCounts()` in
  `src/lib/data/trending.ts`, the same aggregate-only `trending_dishes()`
  RPC with a high limit), ties broken by `SIGNATURE_DISHES` then menu
  order; one slide per distinct photo, dishes without a photo skipped. The
  cover holds 2.5 s (+0.7 s per card down the list), each dish 3.2 s —
  hold time only counts while the card is on screen and the tab visible;
  pauses 8 s after a touch. Tapping a dish slide opens
  `/restaurants/<id>?dish=<dishId>` (the dish deep link), the cover opens
  the plain menu; no autoplay under
  reduced motion or for a closed restaurant; swiping is native
  scroll-snap. Dish photos mount one slide ahead, only once the card has
  been seen. The card's "24 dishes · from ₹60" line comes from
  `getRestaurantMenuStats()` (`src/lib/data/restaurants.ts`).
- **Logo** — the client's logo. Since 1 Oct 2026 it's **v2**,
  `public/logo-v2-1.png` (transparent; everything is generated from it): the
  same art refreshed in a hybrid of the four themes — indigo `#141049` tile,
  cyan scooter, turmeric food box, coral clouds, a crescent moon, "BITES"
  in a cyan → violet → magenta brush. The original `logo-v1-1.png` /
  `logo-v1-2.png` stay in `public/` for reference only. `node
  scripts/build-brand-assets.mjs` regenerates everything below from v2-1 —
  rerun it whenever the logo changes, and bump its `MARK` name (`mark-v3`, …)
  so no image is overwritten in place (the cache rule under photos); the
  name is a literal in five files the script lists:
  - `public/brand/mark-v2-1.webp` / `mark-v2-1.png` — the logo's indigo
    rounded-square icon tile only (scooter, campus, grad cap), found by its
    fill (`isTileFill`, which matches v1's navy too). v2's tile is slightly
    taller than wide (636×670), so it's padded to a square — invisible, the
    pad takes the tile colour wherever it's shown. The
    wordmark and tagline are never used as an image: they're unreadable at
    icon sizes and the transparent file's wordmark carries a coloured glow
    from background removal.
  - `public/brand/mark-v2-1-cap.webp` / `-nocap.webp` — the splash's
    layers: the graduation cap alone and the tile without it, cut from the
    tile with a cap/tassel outline traced on logo v2 (`CAP_POLY` /
    `TASSEL_BOX` in the script, fractions of the tile — retrace for a new
    logo); `MARK_CAP` in `brand-mark.ts` says where the cap sits.
  - `src/lib/brand-mark.ts` — `MARK_TILE` (was `MARK_NAVY`), the tile's
    colour sampled from the art. `BrandLogo` (`src/components/brand-logo.tsx`)
    shows the tile on it, so callers size/round it freely and it reads as
    one tile in both themes (dark mode adds a 1px light rim and a neon glow
    so it doesn't sink into the dark grounds).
  - App icons: `src/lib/app-icon.tsx` puts the tile on `MARK_TILE` for
    `apple-icon.tsx` and `icons/icon-192|512|512-maskable` (maskable at
    `markScale: 0.8` to stay inside the ~80% safe circle). The manifest's
    `background_color` is Electric Sunrise's cream `#FFF8F0` (the default palette).
  - `src/app/favicon.ico` — the tile, 16/32/48/64 RGBA PNG frames (Next
    can't generate `favicon` from code, and its ico decoder rejects
    non-RGBA frames), written by the same script.
- **Startup splash — "One Bite"** (`src/components/splash/`, since 1 Oct
  2026, approved on a preview link first), ~1.5 s, once per browser session
  (sessionStorage `collegebites.splash-shown` — every fresh app/PWA open,
  never on route changes or reloads), never on `/admin`, `/auth`,
  `/privacy`, `/terms` or a tab opened in the background. **No tap-to-skip**
  (by decision). Storyboard and timings in `config.ts`:
  - The screen is the logo's own indigo (`MARK_TILE`) with a violet glow —
    the same in every palette and mode, the logo's world. The tile eases in
    out of a slight blur; its **graduation cap drops into place** (the tile
    is `mark-v2-1-nocap.webp`, the cap `mark-v2-1-cap.webp` positioned by
    `MARK_CAP`, both cut by the brand script; the tile clips the cap as it
    falls), bounces, the tassel swings, the tile bumps; a sheen catches it;
    "College Bites" (cream) and the tagline (cyan) rise in; then **CHOMP**:
    a scalloped bite (three circles in a CSS mask on the indigo layer) snaps
    out of the screen's top-right corner — the bite in the logo's
    "COLLEGE" — and opens across the whole screen onto the app (the radii
    are `@property`-registered and animated; without `CSS.registerProperty`
    the screen fades instead), while the tile glides into the page's own
    logo: the `BrandLogo` with `splashTarget` (Home header, sign-in page),
    or shrinks away if none is on screen.
  - History: a fade (launch), then "The Drop" (a busy neon rider / glitch /
    flying-dish splash) was built and rejected as busy, cartoony and
    off-brand, and reverted. A scooter riding into the logo was tried on the
    preview and dropped. Lesson: one idea, the real logo, premium over
    playful — and preview it (a private Artifact link) before it ships.
  - `app-splash.tsx` is plain server markup (first in `<body>`, styles in
    `splash.css`). `engine.ts` is all the motion — Web Animations on
    transform/opacity — in one self-contained function that
    `init-script.ts` serialises (`runSplash.toString()`) into a raw inline
    `<script>` in the root layout — **not** `next/script`
    `beforeInteractive`, which is queued until Next's JS loads and would let
    the app paint first (the theme-init script, `src/lib/theme/init-script.ts`,
    is inline for the same reason — no light flash for dark users). Keep
    `engine.ts` free of imports and module-scope helpers.
    Fill-mode gotcha: entrances are `fill: "both"`; an animation that takes
    over an element an earlier one already moved must be `"forwards"`, or
    its first frame freezes the element from time zero.
  - Reduced motion: no motion — the finished logo (cap in place) and name
    fade in, hold ~0.65 s, fade out. Safety valves: the logo layers not
    ready within 1.5 s means it doesn't play, any error mid-way ends it at
    once, and CSS hides the overlay after 9 s whatever happens.
  - Replay / disable: `?intro` (or `?splash`) forces it, `?nosplash`
    skips one load, localStorage `collegebites.splash = "off"` disables it on
    one device, `NEXT_PUBLIC_DISABLE_SPLASH=1` removes it from the build.
  - One-off moments that could fire underneath wait with `afterSplash()`
    (`splash/after-splash.ts`) — the milestone celebration does.

`loading.tsx` exists for the restaurant list (`(home)`), the menu page
(`restaurants/[id]`), both order pages (`orders`, `orders/[id]`), and
`profile` — plain skeletons built from `src/components/ui/skeleton.tsx`,
roughly mirroring each page's real layout so nothing visibly jumps.

## Database schema

Defined in these migrations, in the order they apply on a fresh project
(`supabase/migrations/` holds exactly what the database has):
[`supabase/migrations/20260915000000_init_schema.sql`](supabase/migrations/20260915000000_init_schema.sql),
[`supabase/migrations/20260915010000_add_user_role.sql`](supabase/migrations/20260915010000_add_user_role.sql),
[`supabase/migrations/20260915020000_google_oauth_and_ban.sql`](supabase/migrations/20260915020000_google_oauth_and_ban.sql) (the one run by hand in the SQL
editor, so it's missing from the database's migration history),
[`supabase/migrations/20260915030000_ban_by_phone.sql`](supabase/migrations/20260915030000_ban_by_phone.sql),
[`supabase/migrations/20260915040000_drop_block_and_room.sql`](supabase/migrations/20260915040000_drop_block_and_room.sql),
[`supabase/migrations/20260915050000_place_order_function.sql`](supabase/migrations/20260915050000_place_order_function.sql),
[`supabase/migrations/20260915070000_guard_phone_changes.sql`](supabase/migrations/20260915070000_guard_phone_changes.sql),
[`supabase/migrations/20260915080000_admin_dashboard.sql`](supabase/migrations/20260915080000_admin_dashboard.sql),
[`supabase/migrations/20260915100000_admin_users_and_ban.sql`](supabase/migrations/20260915100000_admin_users_and_ban.sql),
[`supabase/migrations/20260915120000_banned_at.sql`](supabase/migrations/20260915120000_banned_at.sql),
[`supabase/migrations/20260915130000_enable_realtime_orders.sql`](supabase/migrations/20260915130000_enable_realtime_orders.sql)
(adds `orders` to the `supabase_realtime` publication —
`src/components/orders/order-tracking.tsx`, a client component, subscribes
to its own order's row for live status updates on top of the normal
server-fetched page; existing RLS still governs who can actually receive
them, and a plain page refresh still shows the true status either way),
[`supabase/migrations/20260915150000_daily_order_numbers.sql`](supabase/migrations/20260915150000_daily_order_numbers.sql)
(adds `orders.daily_number` — see below),
[`supabase/migrations/20260916000000_trending_leaderboard.sql`](supabase/migrations/20260916000000_trending_leaderboard.sql)
(adds `trending_dishes()` / `trending_restaurants()` — see below),
[`supabase/migrations/20260917000000_my_weekly_rank.sql`](supabase/migrations/20260917000000_my_weekly_rank.sql)
(adds `my_weekly_rank()` — see below),
[`supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
(drops `trending_restaurants()` again — never called by the app),
[`supabase/migrations/20260917020000_highly_reordered_dishes.sql`](supabase/migrations/20260917020000_highly_reordered_dishes.sql)
(adds `highly_reordered_dishes()` — see below),
[`supabase/migrations/20260919020000_order_reviews.sql`](supabase/migrations/20260919020000_order_reviews.sql)
(dish ratings — `orders.delivered_at`, `order_reviews`, `order_item_ratings`,
`submit_review()`; see below),
[`supabase/migrations/20260921000000_push_subscriptions.sql`](supabase/migrations/20260921000000_push_subscriptions.sql),
[`supabase/migrations/20260921010000_milestone_rewards.sql`](supabase/migrations/20260921010000_milestone_rewards.sql),
[`supabase/migrations/20260921020000_trending_skip_banned.sql`](supabase/migrations/20260921020000_trending_skip_banned.sql)
(Trending ignores orders before launch, 1 Oct 2026, and from banned phones),
[`supabase/migrations/20260929000000_harden_functions.sql`](supabase/migrations/20260929000000_harden_functions.sql) and
[`supabase/migrations/20260929020000_revoke_banned_check_from_public.sql`](supabase/migrations/20260929020000_revoke_banned_check_from_public.sql)
(Supabase security advisor: fixed `search_path` on trigger functions; no
signed-out access to `current_user_is_banned()` — a revoke from `anon`
alone doesn't work, the grant comes through PUBLIC),
[`supabase/migrations/20260929010000_ordering_switch_and_delivery_minutes.sql`](supabase/migrations/20260929010000_ordering_switch_and_delivery_minutes.sql)
(Open / Closed ordering switch with no schedule, `restaurants.delivery_minutes`,
and `place_order()` in its final form with the rate limits — see
`app_settings` below),
[`supabase/migrations/20260929030000_seed_college_bites_menus.sql`](supabase/migrations/20260929030000_seed_college_bites_menus.sql)
(data only — the three partner restaurants, **Triangle Food Court**
(Kuragallu, 41 dishes), **Local Home Kitchen** (Neerukonda, 72; 81 since 4 Oct 2026) and **Clg
Bites Biryani Nation** (24: Single / Full are separate dishes; 60-minute
delivery), 137 dishes in all; Biryani Nation since has 37 and the total is
150 — see `20261001020000` below). Note the shape: the `values` list comes
first and the restaurant/section are joined onto it by name. A new
restaurant or dish follows the same pattern, plus photo entries in
`src/lib/data/dish-photos.ts`.
**`push_subscriptions`** — one row per device that turned
notifications on (`user_id`, unique `endpoint`, `p256dh`, `auth`,
`user_agent`). RLS: a student reads/writes only their own rows; admins
`select` every row (that's how a status change reaches the student's
phone) and `delete` stale ones. The *new order* send can't use any
student's session, so it goes through the service-role client — see
**Notifications** above.
[`supabase/migrations/20261001020000_biryani_nation_prices_and_new_dishes.sql`](supabase/migrations/20261001020000_biryani_nation_prices_and_new_dishes.sql)
(data only — Biryani Nation's new prices, Single +₹20 / Full +₹40 on all 24
biryanis, plus a Starters section (9) and a Chinese section (4), and
"Chinese" in its cuisine tags; 37 dishes now, 150 in all. Names stay as
before — "Veg Dum Biryani", "Cashew Paneer Mixed Biryani" — so photos keep
matching; "Noodles" is veg, Egg Fried Rice non-veg).
[`supabase/migrations/20261001030000_biryani_nation_menu_update.sql`](supabase/migrations/20261001030000_biryani_nation_menu_update.sql)
(data only — Biryani Nation's second price list: new biryani prices,
Chicken Fry ₹230, "Chicken Dum Biryani (Half)" ₹170 with note "7x9 cover"
(the portion picker knows Half: Half / Single / Full), and a Fried Rice
section — Paneer Fried Rice ₹140, Kaju Fried Rice ₹150; 40 dishes now,
153 in all).
[`supabase/migrations/20261001040000_rls_performance.sql`](supabase/migrations/20261001040000_rls_performance.sql)
(Supabase performance advisor: every `auth.uid()` / `is_admin()` in RLS
wrapped as `(select …)` — evaluated once per query, not per row; each
table's admin + own-row policies for the same action merged into one (their
exact OR — e.g. "Users read own orders; admins read all"); policies scoped
`to authenticated`; indexes on `dishes.category_id`,
`milestone_rewards.marked_by`, `order_items.dish_id`, `order_reviews.user_id`.
Access unchanged — verified with rolled-back student / admin / signed-out
tests. New policies should follow the same `(select auth.uid())` pattern.)
[`supabase/migrations/20261001050000_discount_offers.sql`](supabase/migrations/20261001050000_discount_offers.sql)
(named `discount_offers` in the database's migration history; discount offers: `app_settings.offer_pct10 / offer_pct20 / offer_biryani`
booleans, default off; `orders.discount_offer` (`'pct10' | 'pct20' |
'biryani'` or null) and `orders.discount_amount` (≥ 0); `order_items.is_free`;
and `place_order()` with two optional arguments, `p_offer` and
`p_free_items` — see **Offers** under Admin access and the `orders` notes
below).
[`supabase/migrations/20261004000000_offers_biryani_nation_only.sql`](supabase/migrations/20261004000000_offers_biryani_nation_only.sql)
(named `offers_biryani_nation_only` in the database's migration history;
`place_order()` re-created with one new check — any offer on an order not
from Clg Bites Biryani Nation raises `offer_wrong_restaurant`).
[`supabase/migrations/20261004010000_local_home_kitchen_menu_update.sql`](supabase/migrations/20261004010000_local_home_kitchen_menu_update.sql)
(data only — Local Home Kitchen's new menu: 18 price changes, "Paneer
Majestic" renamed "Kaju Paneer Majestic", five dishes dropped (Chicken /
Egg Manchurian Rice and Noodles, Pepper Chicken), 14 new — SP Boneless
Biryani (note "New"), Double Egg Fried Rice / Noodles and Veg Manchurian
Rice / Noodles with "(White)" styles, Chicken Kaju Manchurian, and two new
sections, **KFC Veg Starters** and **KFC Non-Veg Starters** (KFC Chicken
Lollipop moved there); piece counts live in `note` ("6 pcs"). 81 dishes
now, 162 in all. The photos are developer-supplied; KFC French Fries shows
KFC's branded bucket and KFC Popcorn / Drum Chicken carry recipe-site
watermarks — swap them (new filenames) when better ones arrive).
**`taste_profiles`** ([`supabase/migrations/20261001000000_taste_profiles.sql`](supabase/migrations/20261001000000_taste_profiles.sql),
named `taste_profiles` in the database's migration history) — one row per
student, created the first time they save the "Your taste" sheet:
`user_id` (primary key → `users`, cascade), `avatar` (text, default
`'pot'`, `^[a-z0-9-]{1,32}$` — the app holds the list), `spice_level`
(1–5, null = not answered), `diet` (`'veg' | 'egg' | 'nonveg'`, null = not
answered), `cravings` (text array, only `FOOD_TYPES` keys — adding a food
type to Home needs this check widened in a migration), `updated_at`
(`set_updated_at` trigger). No row = the defaults. RLS: a student selects,
inserts and updates only their own row; no delete policy, no admin access —
nobody else ever sees it.
**`favorite_dishes`** ([`supabase/migrations/20261001010000_favorite_dishes.sql`](supabase/migrations/20261001010000_favorite_dishes.sql))
— the dishes a student hearted: `user_id` → `users` and `dish_id` →
`dishes` (both cascade), `created_at`, primary key `(user_id, dish_id)` —
one heart per dish per student, so it's naturally bounded. Indexes on
`(user_id, created_at desc)` (Profile's list) and `dish_id`. RLS: a student
selects, inserts and deletes only their own rows; no update policy, no
admin access, and no counts shown to anyone — hearts are private.
**`milestone_rewards`** — one row per student whose all-milestones
free biryani was handed over (`user_id` primary key = once per student,
`claimed_at`, `marked_by` admin). RLS: a student selects only their own
row; admins select all, insert (with `marked_by = auth.uid()`) and delete
(undo). No update policy. Whether a student *qualifies* is checked in the
app (`getUnlockedMilestones()`), not the database — see **Profile** above.
The timestamps before 29 Sep are the schema's original design order; a
few of those files mention VIT-AP / Main Gate in their SQL comments —
left as they are, because applied migrations are never edited.
Migrations are applied through the Supabase connector (project
`cpatbcisnrvyjztyqutq`), only after the SQL has been shown in chat and
approved.

All orders are handed over at **Gate 3** — there is no room
delivery, so no hostel block/room is stored anywhere (not on `users`, not
on `orders`).

- **`users`** — student profile, 1:1 with `auth.users` (same `id`, cascades
  on delete). `full_name` and `phone` are both `not null`; `phone` is
  **not unique** — multiple Google accounts can share a phone number
  (`email` stays `not null unique`, one row per Google account, just not
  one per phone). No domain restriction on `email` — decided: any Google
  account can sign up, not only SRM AP student addresses. Stored
  as `+91XXXXXXXXXX` — the app normalizes every
  input to that one shape (`src/lib/phone.ts`), since bans match by exact
  phone. Also `registration_number`, `role` (`user_role` enum: `student` |
  `admin`, default `student`), `is_banned` (default `false` — an admin
  flips this from the admin `/admin/banned` page, e.g. for
  repeat no-shows; `role` itself is still only ever changed by hand in the
  database, never through the app), `banned_at` (nullable timestamptz, kept
  correct by the `set_banned_at` trigger — set to `now()` whenever
  `is_banned` flips true, cleared back to `null` when it flips false again,
  regardless of whether the change came through the app or the SQL editor).
  No `public.users` row is auto-created on
  OAuth sign-in — the app creates it itself, once, when the first-login
  form (full name + phone) is submitted; that's also how the app tells
  first-time vs. returning users apart (row exists or not).
- **`restaurants`** — `name`, `phone`, `description`, `cuisine_tags` (text
  array), `is_active`.
- **`dish_categories`** — menu sections scoped to a restaurant (e.g. "Veg
  Starters (500ml)", "Chicken Biryani"), with `sort_order` for display.
- **`dishes`** — belongs to a restaurant and (optionally) a category;
  `price`, `is_veg`, `note` (freeform, e.g. "Thursday Only"), `is_available`.
- **`orders`** — `user_id`, `restaurant_id`, `status` (`order_status` enum:
  `pending → confirmed → preparing → out_for_delivery → delivered`, or
  `cancelled`), `contact_phone`, `notes`, `total_amount`. No payment fields — COD only.
  `total_amount` is what the student pays: `sum(order_items.subtotal) -
  discount_amount`. `discount_offer` / `discount_amount` record the offer
  used. A free Single biryani is its own `order_items` row with
  `is_free = true` and its real menu price (so history stays truthful);
  its value is the order's `discount_amount`.
  The admin dashboard only ever drives two of those transitions directly —
  `pending → confirmed` and `confirmed → delivered` (`preparing` /
  `out_for_delivery` stay valid enum values but nothing in the app sets
  them; delivery timing is a fixed promise per restaurant, not admin clicks) — plus
  a side-path to `cancelled` from any non-terminal status, each one
  compare-and-swapped on the status the admin's screen showed, so a stale
  screen or two admins clicking at once can't skip a step or act on a
  status that's already changed. Also `daily_number` (`not null int`) —
  the order's position that IST calendar day, campus-wide across every
  restaurant, starting over at 1 each day — this is the "token"/order
  number shown to both the student (pickup) and the admin (order list),
  so the two must always agree. Assigned once, atomically, by the
  `set_daily_order_number` trigger (`before insert on orders`) via the
  `daily_order_counters` table below — never derived by counting/ranking
  on read, so concurrent orders in the same second can't collide or show
  differently to student vs. admin. Every display reads `daily_number`
  directly.
- **`orders.delivered_at`** (nullable timestamptz) — set to `now()` by the
  `set_delivered_at` trigger whenever `status` becomes `delivered`
  (single or bulk "Mark delivered"). The 7-day review window counts from
  it.
- **`order_reviews`** — one row per order (`order_id` primary key),
  `user_id`, optional `note` (≤ 300 chars), `created_at`. **`order_item_ratings`**
  — one row per dish in that order (`order_item_id` primary key, `order_id`,
  `dish_id` set null if the dish is ever deleted, `rating` 1–5). Stars per
  dish, one note per order, **no photos** (decided against: storage and
  cleanup cost). RLS: a student reads only their own review/ratings,
  admins read all; no insert/update/delete policies — the only write path
  is `public.submit_review(order_id, ratings jsonb, note)` (security
  definer, authenticated only), which checks the caller owns the order,
  it's `delivered`, `delivered_at` is within 7 days, it isn't already
  reviewed (submit once, no edits), and there's exactly one 1–5 rating
  for every item in the order. Error keys: `order_not_found`,
  `not_delivered`, `review_window_closed`, `already_reviewed`,
  `note_too_long`, `invalid_ratings`. Reviews are **never shown to other
  students** — admin-only feedback.
  UI: `RateOrder` (`src/components/orders/rate-order.tsx`) on the order
  tracking page — shows the moment status turns `delivered` (Realtime also
  carries `delivered_at`), opens a bottom sheet with 1–5 stars per dish
  (all required) and the optional note, submits via `submitReview()`
  (`src/lib/reviews/actions.ts`, maps the error keys), then shows "You
  rated this". `getOrder()` returns `items[].id`, `deliveredAt` and the
  student's own `review`. Nudges: the Orders list shows an amber "Rate your
  order" pill on rateable orders (`OrderSummary.rateable` — delivered,
  within 7 days, not rated), and Home shows a one-time pop-up
  (`RatePrompt`, `getRatePromptOrder()`) for the latest one, remembered
  per device in `localStorage` (`collegebites.rate-prompted`). Both link to
  `/orders/<id>?rate=1`, which opens the rating sheet on arrival.
  `REVIEW_WINDOW_MS` lives in `src/lib/reviews/limits.ts` (client-safe).
  Admin reads them at `/admin/reviews` (a "Reviews" pill on the dashboard):
  `getAdminReviews()` (`src/lib/data/admin.ts`) + `ReviewsView` — dish
  averages (lowest first) and review cards, filtered by restaurant and by
  "Needs attention" (any dish ≤ 2★) / "With notes".
- **`daily_order_counters`** — `order_day` (date, primary key), `last_number`.
  One row per day, upserted by the trigger above (`on conflict (order_day)
  do update set last_number = last_number + 1 returning ... into
  new.daily_number`) — the atomic counter that makes `daily_number`
  race-free. The app never reads or writes this table directly; RLS is
  enabled with no policies (locks it out entirely), and the trigger's
  writes succeed anyway since they run inside `place_order()`'s
  security-definer context, the same way `place_order()` itself writes to
  `orders`/`order_items` without student-facing insert policies.
- **`order_items`** — snapshots `dish_name` and `unit_price` at order time
  (quantity, generated `subtotal`), so later menu edits never rewrite past
  order history. `dish_id` is `on delete set null` for the same reason.
- **`app_settings`** — single-row table (`id boolean primary key default
  true check (id)` caps it at one row) holding `ordering_mode`
  (`'open' | 'closed'`, default `'open'`), the campus-wide ordering
  switch the admin dashboard's Today card sets. **No daily schedule** —
  the client opens and closes ordering whenever they like. Public-read (the
  student app needs to know whether it can order), admin-only update.
  `public.ordering_is_open()` (security definer, callable by anon +
  authenticated) just reads it and is the single source of truth —
  `place_order()` checks it, and the app reads it via `getOrderingState()`
  (`src/lib/data/settings.ts`), with the wording ("Ordering is closed right
  now") from `describeOrdering()` in `src/lib/ordering.ts`. Defined in
  `20260929010000_ordering_switch_and_delivery_minutes.sql`, which also
  drops the earlier `ordering_enabled` boolean it replaced.
- **`restaurants.delivery_minutes`** (`int not null default 40`, 5–240) —
  how long after placing an order it's promised by. The ticket, the admin
  order page and "Current orders" all compute from it (`src/lib/date.ts`).

RLS is enabled on every table:
- `restaurants` / `dish_categories` / `dishes` are public-read (browsing the
  menu doesn't require login). Writes (insert/update/delete) are allowed
  for `role = 'admin'` users (via the `public.is_admin()` helper), gating
  menu/availability management.
- `users` / `orders` / `order_items` are scoped to `auth.uid()` — a student
  can only read their own profile, orders, and order items (and
  insert/update their own profile). Students **cannot insert into `orders`
  or `order_items` directly** — there are no insert policies for them.
  The only way to create an order is the `public.place_order(restaurant_id,
  items jsonb, contact_phone, notes)` function (security definer, callable
  by `authenticated` only): one transaction that checks auth, profile, ban,
  contact phone format, restaurant `is_active`, and every dish belonging to
  the restaurant and `is_available`; snapshots dish name/price from
  `dishes` (never from the client); leaves `status` at `pending`; and
  computes `total_amount` itself. Offers: with `p_offer` set it raises
  `offer_unavailable` if that switch is off, and for `'biryani'` checks every
  `p_free_items` entry is an available "… Biryani (Single)" from the same
  restaurant and that there's at most one per 3 paid "… Biryani (Full)"
  (`offer_not_eligible`); it computes the discount itself (10% / 20% of the
  paid items, `round()`ed, or the free items' value). Free items without
  the biryani offer are `invalid_items`. It also checks `public.ordering_is_open()`
  before anything else (raising `ordering_paused` while the admin has
  ordering closed) — enforced in the function itself, not just hidden in the UI,
  since a direct PostgREST call would otherwise bypass an app-level check.
  It also rate-limits right after the ban check: at most **5 orders per
  student per minute** (`order_rate_limited`) and **8 unfinished orders**
  (not delivered/cancelled) at once (`too_many_open_orders`), under a
  per-student `pg_advisory_xact_lock` so simultaneous taps can't both slip
  under. The cart is kept on any refusal. Login needs no limit of ours —
  Google-only, and Supabase Auth's own rate limits apply.
- **Security headers** (`next.config.ts`, every path): `X-Frame-Options:
  DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (no camera/mic/location); HSTS comes from Vercel.
  CSP is a moderate policy (`'unsafe-inline'` scripts because the
  theme/splash init scripts and JSON-LD are inline on purpose; connections
  only to self + Supabase REST/Realtime), **enforced** since 1 Oct 2026 —
  violations POST to `/api/csp-report` (excluded from the proxy matcher)
  and land in Vercel logs as `[csp] …`. Switch the header key to
  `Content-Security-Policy` once the logs are clean; add any new external
  origin to it. (Launched still report-only; to switch, browse the
  signed-in screens, then search the Vercel dashboard → Logs for `csp`
  within the hour — Hobby keeps about an hour of logs. A real report
  logs as a Warning.)
  It raises short error keys
  (`banned`, `restaurant_closed`, `dish_unavailable`, `ordering_paused`, …) that
  `src/lib/orders/actions.ts` maps to messages. Admins
  can additionally update any `orders` row (e.g. changing `status`) and read
  every `orders` row, every `users` row, and every `order_items` row (not
  just their own — needed for the admin dashboard's order list, stat
  counts, and showing who placed each order) — the orders update policy
  covers the whole row, not just `status`, since Postgres RLS can't
  restrict to a single column without a trigger. Admins can also update
  any `users` row (needed for the ban toggle — see below).
- Ban enforcement is by **phone number, not account**: `place_order()`
  calls `public.current_user_is_banned()`, which — despite the
  name — checks whether *any* `users` row sharing the calling account's
  phone number has `is_banned = true`, not just the calling account
  itself. This closes the loophole where a banned student just signs up
  again with a new Google login but the same phone number. Accepted
  tradeoff: two different students who happen to share a phone number
  (e.g. a shared hostel/family line) would both get blocked if either is
  banned — deliberately not scoped more precisely than that right now.
  The cart shows a friendly message when an order is refused for a ban.
- There is no admin login system: a user becomes an admin by manually
  setting their own `users.role` to `'admin'` in the database after signing
  up normally — `role` stays changeable only that way, never through the
  API, admin included. `is_banned` **can** now be changed through the API,
  but only by an admin (the `/admin/banned` page — search a
  student to ban them, or unban from the banned list — on any student's
  row; a student still can't touch their own `is_banned`). A trigger
  (`prevent_role_self_escalation`, despite the name it now guards `role`,
  `is_banned`, **and `phone`**) enforces both: it blocks any API change to
  `role` outright, and blocks an API change to `is_banned` unless the
  caller is an admin (`public.is_admin()`) — so the existing "update own
  profile" policy can't be used to self-promote or self-unban, and the new
  "admins can update any user" policy can't be used by a student (it only
  grants anything to `role = 'admin'` callers to begin with). For `phone`,
  the trigger still blocks the change outright via the API regardless of
  admin status — direct DB access (SQL editor, migrations) is unaffected
  and remains the only way around any of these.
  Specifically for `phone`: the trigger raises if the account is currently
  `is_banned` (permanent — bans match by live phone at order time, so
  letting a banned student change it would let them escape the ban
  outright) or if the student has any order not yet `delivered`/`cancelled`
  (temporary — the delivery contact number shouldn't change mid-order).
  The app enforces the same two rules up front in
  `src/app/profile/actions.ts` (for a friendly message instead of a raw
  DB error), but the trigger is the real boundary — `users` is reachable
  directly via PostgREST with a student's own access token, bypassing the
  app entirely.

- **`trending_dishes(days_back int default 7, result_limit int default 5)`**
  — security definer, callable by `authenticated` only, same pattern as
  `place_order()`. Powers the ranked start of Home's "Campus favourites"
  row (`popular-rail.tsx`; the old Trending popup is gone): top ordered dishes campus-wide over a rolling window
  (`orders.status <> 'cancelled'`, restaurant `is_active`, dish
  `is_available`). Needed because students can only read their *own*
  orders/order_items under RLS — there's no other way to compute a
  cross-student aggregate. Returns only aggregate counts (dish/restaurant
  name + a number), never anything per-student, so nothing here leaks who
  ordered what. Since
  [`20260921020000_trending_skip_banned.sql`](supabase/migrations/20260921020000_trending_skip_banned.sql)
  it also skips orders placed before launch (1 Oct 2026, IST) and orders
  from any **banned phone number** — banning a test account keeps its
  orders out, and unbanning brings them back into Trending (and into the
  Home card slide order, which uses the same RPC).
  `highly_reordered_dishes()` / `my_weekly_rank()` deliberately don't
  filter either way.

`trending_restaurants(days_back int default 7, result_limit int default 3)`
was added in the same migration (same pattern) for a "Top restaurants"
leaderboard that got removed from the UI before shipping, then dropped in
[`20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
once confirmed unused — it no longer exists in the database.

- **`my_weekly_rank(days_back int default 7)`** — security definer,
  callable by `authenticated` only. Returns only the *calling* student's
  own row (`where user_id = auth.uid()` inside the function) — order
  count, rank, and percentile among everyone who ordered in the window —
  never other students' counts or identities, unlike `trending_dishes()`
  above which returns aggregate-only data with no user scoping at all.
  Powers the profile's weekly-rank badge
  (`src/components/profile/weekly-rank-badge.tsx`), shown only when
  `percentile <= 50` and at least 5 students participated that week — a
  UI-only choice (not a security one) so the badge stays flattering and
  the percentile stays statistically meaningful, not a database
  restriction. The raw percentile is never shown directly — "Top 40%"
  reads as confusing, so the UI maps it to one of three tier labels
  instead (Top orderer `<=10%`, Frequent orderer `<=25%`, Active orderer
  `<=50%`); `percentile`/`rank`/`totalStudents` stay in the returned row
  for that mapping and are the only reason the raw numbers still exist.

- **`highly_reordered_dishes(min_repeat_students int default 3,
  result_limit int default 10)`** — security definer, callable by
  `authenticated` only, same aggregate-only pattern as `trending_dishes()`.
  A dish qualifies when at least `min_repeat_students` distinct students
  have each ordered it 3+ times (`orders.status <> 'cancelled'`) — a
  genuine repeat-purchase signal, deliberately different from
  `trending_dishes()`'s raw order-volume popularity. Powers the menu's
  "Highly re-ordered" tag (`src/components/menu/dish-card.tsx`, alongside
  the existing "Your usual" tag (the student's most-ordered dish there,
  `getUsualDishId()` — called "Your favorite" until 1 Oct 2026, renamed so
  it isn't confused with hearts) — the card shows one of the two, with
  "Your usual" winning if a dish is both), fetched via
  `getHighlyReorderedDishIds()` in `src/lib/data/reorders.ts`.

No other open schema TODOs right now (see "Pending decisions" below for
one that will eventually need its own migration, once approved).

## Pending (as of 30 Sep 2026)

Parked by the developer — do these only when asked.

**Before / around launch**
- **Clear test orders** — wait for the developer's prompt; show the delete
  SQL first (orders, their items, ratings and `daily_order_counters`, so
  launch day starts at token #1 with empty history).
- **Publish the Google sign-in app** out of "Testing" (Google Auth
  Platform → Audience) — until then only listed test users can sign in.
- ~~Switch the content policy to enforced~~ — done 1 Oct 2026. Was: browse the signed-in
  screens, then within the hour search Vercel dashboard → Logs for `csp`
  (Hobby keeps ~1 hour; a real report is a Warning). Empty (ignoring the
  `TEST-from-Claude-ignore` line) → change the header key in
  `next.config.ts` to `Content-Security-Policy`.

**Worth doing soon (code only, no database)**
- ~~Harden the admin passcode cookie~~ — done 1 Oct 2026: the cookie holds
  an HMAC of the admin's user id keyed by `ADMIN_PASSCODE`
  (`passcodeToken()`), compared in constant time (`safeEqual()`); it only
  works for that admin and changing the passcode logs every device out.
  Was: it stored the passcode
  value itself (httpOnly, `/admin`-scoped). Store a signed token (HMAC of
  the passcode with a server secret) and compare in constant time
  (`src/lib/admin/passcode.ts` / `passcode-actions.ts`).

**When the client has time**
- **Photos** — done: every dish has a photo (no follow-up planned). Openly
  licensed ones are credited on `/terms` from `src/lib/data/photo-credits.ts`
  (add a line there for any new photo with such a licence); the rest are
  developer-supplied. A new or replaced photo = new filename + an entry in
  `dish-photos.ts`, no database change.

**Optional, later**
- **Google Search Console** — set up 1 Oct 2026: verified by the HTML tag
  (`GOOGLE_SITE_VERIFICATION` env var in Vercel), `sitemap.xml` submitted
  (it showed "Couldn't fetch" at first, the usual state before Google's
  first read — recheck after a few days).
- ~~Supabase performance suggestions~~ — done 1 Oct 2026
  (`20261001040000_rls_performance.sql`). Was: wrap `auth.uid()` as
  `(select auth.uid())` in policies, add indexes on a few foreign keys;
  only matters if order volume grows, and goes through the schema hard
  rule.
- ~~Automated WhatsApp confirmation~~ — dropped by decision (1 Oct 2026).

## Ideas not started

- **Automated WhatsApp order confirmation** — not discussed with the client
  yet. Today the admin's WhatsApp button (`src/components/admin/order-card.tsx`)
  opens a `wa.me` link with prefilled text; the admin sends it, reads the
  reply and taps Confirm. Automating it (the server sends the message via
  the WhatsApp Business Platform the moment `placeOrder()` succeeds, and a
  webhook confirms on "yes") would need the client to agree first to: a
  per-message cost (~₹0.115 + GST from Meta, plus any provider fee), the
  support number (`9989955833`, `src/lib/support.ts`) moving to the
  Business Platform so it can't be used in the normal WhatsApp app, and
  Meta's business verification and template approval. It would also need
  a signature-verified webhook, a rule for students with more than one
  pending order, and its own migration — subject to the hard rule below.

## Hard rule: schema changes

**Never change the database schema without showing the SQL first**, in
chat, and getting explicit go-ahead — regardless of how small the change
looks. After approval, add a new timestamped file under
`supabase/migrations/` (never edit a migration that's already been applied)
and update the schema summary above to match.
