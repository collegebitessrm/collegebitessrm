# College Bites — project blueprint

Everything about College Bites in one place: what it is, how it's set up
outside the code, how it's built, the rules it runs on, every database
migration, what went wrong along the way and what's still open.
`CLAUDE.md` is the detailed code-level reference; this is the overview.

---

## 1. Snapshot

| | |
|---|---|
| What | Food ordering site for SRM University AP students (Amaravati, Andhra Pradesh) |
| Name / tagline | **College Bites** — "Crave. Click. Campus." ("SRM" only in small places) |
| Live | https://collegebitessrm.vercel.app |
| Repo | https://github.com/collegebitessrm/collegebitessrm (private, branch `main`) |
| Launch | 1 Oct 2026 |
| Pickup | Everything is handed over at **Gate 3**. No room delivery. |
| Payment | **Cash on delivery only**, with UPI accepted informally at pickup (the app never processes payments). Delivery to Gate 3 is free. |
| Sign-in | "Continue with Google" only |
| Restaurants | Triangle Food Court (Kuragallu, 41 dishes), Local Home Kitchen (Neerukonda, 72), Clg Bites Biryani Nation (24) |
| Delivery promise | 40 minutes from ordering; Biryani Nation 60 |
| Ordering | An **Open / Closed** switch the admin flips — no daily schedule |
| Support | +91 99899 55833 (call + WhatsApp) · collegebitessrm@gmail.com |
| Admin alerts go to | collegebitessrm@gmail.com |
| Stack | Next.js 16 (App Router, customised build), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on `@base-ui/react`, lucide icons, Supabase (Postgres, Auth, RLS, Realtime), `web-push`, Vercel (Hobby) |
| Regions | Supabase `ap-south-1` (Mumbai), Vercel functions pinned to `bom1` (Mumbai) |
| Target look | `docs/design-reference.webp` (the client's brand sheet) |
| Team guide | `docs/CLIENT-GUIDE.md` (plain English, for the people running it) |

---

## 2. How we work

1. **Show the SQL first.** Never change the database without showing the
   exact SQL in chat and getting a clear go-ahead. Then add a new
   timestamped file in `supabase/migrations/` (never edit an applied one)
   and update `CLAUDE.md`'s schema section.
2. **Migrations go through the Supabase connector** (project
   `cpatbcisnrvyjztyqutq`) after approval. `supabase/migrations/` always
   holds exactly what the database has.
3. **One step at a time.** Build it, check it (build, lint,
   `npm run audit:contrast`, light and dark, 320 px), say exactly what to
   test, wait for "go". "Plan mode" means a plan only.
4. **Commit and push every step** to `main`; Vercel deploys in ~30 s.
   Batch small follow-ups (Hobby: 100 deploys a day, one build at a time).
   Commits must be authored by `collegebitessrm <collegebitessrm@gmail.com>`
   (set repo-locally) — Hobby refuses to build anyone else's commits.
5. **Check on the live site**, not localhost. Signed-in screens are checked
   by the developer on a phone.
6. **This is a customised Next.js.** Read `node_modules/next/dist/docs`
   before using an API you're unsure of (`proxy.ts` instead of
   `middleware.ts`, error boundaries get `retry`, `after()`).
7. **The database is the real security boundary.** Every app-side check
   is repeated in RLS, a trigger or a security-definer function.
8. **No emoji, no uppercase text, lucide icons only.** Cash on delivery
   only — no payment code, ever.

---

## 3. Setup outside the code

### Supabase
1. Project `collegebitessrm`, region **ap-south-1 (Mumbai)**.
2. Keys (URL, anon, service-role) go into Vercel env vars and a local
   `.env.local` (gitignored) — never into chat or git.
3. **Authentication → Sign In / Providers → Google**: enabled, with the
   Google Client ID and Secret. Callback:
   `https://cpatbcisnrvyjztyqutq.supabase.co/auth/v1/callback`.
4. **Authentication → URL Configuration**: Site URL
   `https://collegebitessrm.vercel.app`; redirect URLs
   `https://collegebitessrm.vercel.app/**` and `http://localhost:3000/**`.
5. **Authentication → Rate Limits**: sign-ups and sign-ins raised to 100
   per 5 minutes (campus Wi-Fi puts many students behind one IP).
6. Admins: sign up through the app once, then
   `update public.users set role = 'admin' where email = '…';`
   (today: collegebitessrm@gmail.com and nagaadithya999@gmail.com).
   Never rename columns in the Table Editor — use SQL.

### Google Cloud (sign-in)
- Project "College Bites". **Google Auth Platform**: External; app name
  College Bites; support/developer email collegebitessrm@gmail.com;
  scopes `openid`, `email`, `profile`; privacy and terms links
  (`/privacy`, `/terms`); authorized domains
  `collegebitessrm.vercel.app` (and the Supabase project domain).
- **Clients → Web application**: redirect URI = the Supabase callback.
- While "Testing", only listed test users can sign in — **publish** the
  app before real students use it.

### Vercel
- Team/project `collegebitessrm` (Hobby), imported from the GitHub repo.
- `vercel.json` pins functions to `bom1` (Mumbai) to sit next to Supabase;
  without it every request crosses to US-East and pages take 2–3 s.
- Env vars (section 11). Every push to `main` deploys.
- The Vercel CLI (`npx -y vercel@latest`) needs `login` as the
  collegebitessrm account. A deploy stuck on "Initializing" is usually a
  Vercel incident — check https://www.vercel-status.com before redeploying.

### Web push keys and admin passcode
- `npx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY`.
- `ADMIN_PASSCODE` — the second admin lock. Unset = nobody gets into
  `/admin` (fails closed).

### Google Search Console (optional)
Add a URL-prefix property for the live URL with the "HTML tag" method,
put only the `content` token in `GOOGLE_SITE_VERIFICATION`, redeploy,
verify, submit `sitemap.xml`.

---

## 4. Architecture

### Routes
| Route | What | Access |
|---|---|---|
| `/login` | Photo-mosaic sign-in, "Continue with Google" | public |
| `/auth/callback` | Swaps Google's code for a session | public |
| `/welcome` | First-login form (full name + phone), once | signed in, no profile yet |
| `/` | Home: mood header, search, restaurant cards | student |
| `/restaurants/[id]` | Menu (`?dish=<id>` deep link) | student |
| `/orders`, `/orders/[id]` | Order history; tracking ticket (`?rate=1` opens rating) | student |
| `/profile` | Member card, milestones, reward, details, settings | student |
| `/privacy`, `/terms` | Static policy pages | public |
| `/admin` (+ `history`, `orders/[id]`, `users`, `banned`, `reviews`, `sold-out`) | Admin | admin + passcode |
| `/api/csp-report` | Logs content-policy reports | public |
| icons, manifest, robots, sitemap, share image | | public |

### The sign-in guard
`src/proxy.ts` refreshes the session on every request and sends signed-out
visitors to `/login`. Anything a signed-out browser, phone or bot fetches
(icons, manifest, `sw.js`, `robots.txt`, `sitemap.xml`, the share image,
`/api/csp-report`) is excluded from its matcher. Pages call
`requireProfile()` (signed out → `/login`, no profile → `/welcome`); admin
pages call `requireAdmin()` and then check the passcode.

### Data and writes
Reads are server functions in `src/lib/data/*` under the student's own
RLS. Writes are server actions: orders → `place_order()`, reviews →
`submit_review()`, profile/first login, admin actions (each admin-checked,
RLS the real boundary). The service-role key is used in one place only:
finding the admin's devices for the new-order push. Push sends run in
`after()` so they never slow a response.

### Browser-side state
Stores on `useSyncExternalStore` for cart, theme, toasts and sound. Device
keys, all prefixed `collegebites.`: `cart.v1`, `theme`, `sound-enabled`,
`admin-alert-sound`, `confetti-shown`, `milestones-seen`, `notify-asked`,
`rate-prompted`, `splash-shown` (sessionStorage), `splash` (`"off"`
disables it). Sign-out clears the cart first.

---

## 5. Database

RLS is on for every table; anything a student could do through the app
they could also try through Supabase's REST API with their own token, so
every rule lives in the database.

**Tables:** `users` (1:1 with `auth.users`; phone not unique; role;
`is_banned` + `banned_at`), `restaurants` (with `delivery_minutes`),
`dish_categories`, `dishes` (`is_available` = sold-out flag), `orders`
(status, `daily_number` token, `delivered_at`; no payment fields),
`order_items` (name and price snapshotted), `daily_order_counters`,
`app_settings` (one row, `ordering_mode` `'open' | 'closed'`),
`order_reviews` + `order_item_ratings`, `push_subscriptions`,
`milestone_rewards`.

**Functions:** `is_admin()`, `current_user_is_banned()` (any account with
the caller's **phone** banned), `ordering_is_open()`, `place_order()` (the
only way to create an order), `submit_review()` (the only way to rate),
`trending_dishes()`, `highly_reordered_dishes()`, `my_weekly_rank()` —
the last three return counts only, never who ordered what.

**`place_order()` checks, in order:** signed in → has a profile →
ordering open (`ordering_paused` if not) → not banned by phone → rate
limit (5 orders a minute, 8 unfinished, under a per-student lock) → phone
format `^\+91[6-9][0-9]{9}$` → note ≤ 200 → restaurant on → cart not empty
→ quantities 1–20, no duplicates → every dish belongs to the restaurant
and is available → insert with prices taken from `dishes`, total computed
in the database.

**Triggers:** `prevent_role_self_escalation` (no API changes to `role`;
`is_banned` only by an admin; `phone` locked while banned or with an
unfinished order), `set_banned_at`, `set_daily_order_number` (race-free
daily token), `set_delivered_at`, `set_updated_at`.

### Migrations, in order
All applied through the connector except #3, which was run by hand in the
SQL editor (so it's missing from the database's migration history).

| # | File | What |
|---|---|---|
| 1 | `20260915000000_init_schema` | Six core tables, RLS |
| 2 | `20260915010000_add_user_role` | `role`, `is_admin()`, admin write policies, escalation trigger |
| 3 | `20260915020000_google_oauth_and_ban` | Phone required, `is_banned`, ban check |
| 4 | `20260915030000_ban_by_phone` | Phone not unique; ban by phone |
| 5 | `20260915040000_drop_block_and_room` | No hostel block/room anywhere |
| 6 | `20260915050000_place_order_function` | `place_order()`; students lose direct inserts |
| 7 | `20260915070000_guard_phone_changes` | Trigger guards phone |
| 8 | `20260915080000_admin_dashboard` | Admins read orders; `app_settings` |
| 9 | `20260915100000_admin_users_and_ban` | Admins read users/items; admin ban |
| 10 | `20260915120000_banned_at` | `banned_at` + trigger |
| 11 | `20260915130000_enable_realtime_orders` | Orders in Realtime |
| 12 | `20260915150000_daily_order_numbers` | Daily token counter + trigger |
| 13 | `20260916000000_trending_leaderboard` | `trending_dishes()` |
| 14 | `20260917000000_my_weekly_rank` | `my_weekly_rank()` |
| 15 | `20260917010000_drop_unused_trending_restaurants` | Drops an unused function |
| 16 | `20260917020000_highly_reordered_dishes` | `highly_reordered_dishes()` |
| 17 | `20260919020000_order_reviews` | Ratings tables, `submit_review()`, `delivered_at` |
| 18 | `20260921000000_push_subscriptions` | Push subscriptions |
| 19 | `20260921010000_milestone_rewards` | Free-biryani claims |
| 20 | `20260921020000_trending_skip_banned` | Trending skips pre-launch (1 Oct) and banned phones |
| 21 | `20260929000000_harden_functions` | Fixed `search_path`; ban check not for signed-out |
| 22 | `20260929010000_ordering_switch_and_delivery_minutes` | Open/Closed switch, `delivery_minutes`, final `place_order()` with rate limits |
| 23 | `20260929020000_revoke_banned_check_from_public` | Completes #21 (the grant came through PUBLIC) |
| 24 | `20260929030000_seed_college_bites_menus` | Data: the three restaurants and 137 dishes |

Files apply cleanly in filename order on a fresh project. A few of the
early files mention VIT-AP / Main Gate in their SQL comments; applied
migrations are never edited, so they stay.

---

## 6. Business rules

- **Ordering:** Open / Closed, set by the admin. Closed also turns every
  restaurant off; reopening leaves them off (turning one on while Closed
  offers to reopen ordering).
- **Delivery promise:** placed time + the restaurant's `delivery_minutes`
  ("Delivery by 8:40 PM"). "Current orders" drops finished orders once that
  time passes; "Mark all delivered" delivers every confirmed order.
- **Tokens:** `#1, #2, …` per IST day across all restaurants, assigned by
  the database; student and admin always see the same number.
- **Bans:** by phone number — any account with that number is blocked; a
  banned account can't change its number.
- **Milestones** (never re-lock): First Bite (1 delivered), Regular (10),
  Campus Explorer (every active restaurant), Campus Foodie (25), Gate
  Legend (50), Centurion (100). All six → one free biryani, claimed on
  WhatsApp and marked once by an admin.
- **Limits:** 20 per dish, 200-character notes; 5 orders a minute, 8
  unfinished; reviews within 7 days of delivery, once per order, 300
  characters; Trending = last 7 days, top 5; weekly rank shown only in
  the top half and with ≥5 students.

---

## 7. Design

Target: `docs/design-reference.webp`. Airy pastel surfaces, navy for text
and pill buttons, teal accents, soft yellow highlights.

- **Colours:** navy `#173F6B` (the brief's `#0A2540` read as black), teal
  `#00C2A8` (as text `#007A6B`), soft yellow `#F6DC8A` (the brief's
  `#F5C518` was too loud). Light: mint ground `#EFF7F6`, white cards,
  periwinkle-tint wells, periwinkle borders. Dark: lifted navy `#15325A`
  → `#1C3F6E` → `#234A7E`. Hero surfaces (ticket, member card, cart bar,
  banners, admin Today card) are a periwinkle → lavender gradient with
  navy text in both themes; buttons are navy pills; selected chips teal.
- **Contrast:** `npm run audit:contrast` checks every text/surface pair in
  both themes (plus the Home heading over each mood colour) and fails
  below the minimum. Run it after any colour change.
- **Type:** Fraunces for display and big numbers, Plus Jakarta for body
  and all buttons; named sizes; no mono, no uppercase.
- **Motion:** CSS and Web Animations only; everything respects reduced
  motion. The theme toggle cross-fades.
- **Every page has exactly one `<h1>`.** Check changes at 320 px, light
  and dark.

### Logo, icons, splash
- Source `public/logo-v1-2.png` (transparent). `node
  scripts/build-brand-assets.mjs` cuts the navy icon tile (found by its
  navy fill, stopping at the gap above the wordmark) into
  `public/brand/mark.webp|png`, the favicon and `MARK_NAVY`.
- App icons and `BrandLogo` show the tile on its own navy. The wordmark is
  never an image (glow fringe from background removal; unreadable small) —
  it's set in the app's fonts on the splash and share card.
- Splash: ~1.6 s, once per session: the tile rises in, "College Bites" and
  the tagline follow, then a fade to the app. Tap skips; reduced motion
  fades only; never on admin/auth/legal pages or a background tab; CSS
  hides it after 9 s whatever happens.

### Photos
`public/photos/dishes/` and `public/photos/covers/`, matched by exact
restaurant + dish name in `src/lib/data/dish-photos.ts` (not a database
column). 107 of 137 dishes have a photo; the rest show a striped
placeholder rather than a wrong photo. A replaced photo gets a **new
filename** (an outside cache can keep serving old files by URL). The
sign-in mosaic, empty states and share card reference files by path.

---

## 8. Notifications

`public/sw.js` handles notifications only (no fetch handler, so it can
never serve a stale page). Students get confirmed / delivered / cancelled;
the admin gets every new order (via the service-role key) plus a loud
in-page alarm while admin is open. Browsers block sound until a tap, so
the admin taps "Tap to arm sound" each visit.

---

## 9. Security

- Two-layer admin (role + passcode), passcode only in env vars, fails
  closed.
- Prices, totals, availability, ordering state, bans and rate limits are
  all decided inside `place_order()`.
- Headers: `X-Frame-Options: DENY`, `nosniff`,
  `strict-origin-when-cross-origin`, no camera/mic/location; HSTS from
  Vercel.
- Content-Security-Policy: self + Supabase, inline scripts allowed (theme,
  splash and structured data are inline on purpose); **report-only** at
  launch. Reports log as `[csp]` Warnings (Vercel dashboard → Logs, search
  `csp`; Hobby keeps about an hour).
- Supabase security advisor: only expected notices (the functions students
  are meant to call; the counter table with no policies on purpose).

---

## 10. Lessons learned

| Problem | Cause | Fix / lesson |
|---|---|---|
| First Vercel deploy "Blocked" | Commit authored by a personal git identity | Hobby only builds the owner's commits — author commits as collegebitessrm |
| Security revoke didn't take | The function's access came through PUBLIC, not `anon` | Revoke from `public, anon`, grant to `authenticated` |
| Several migrations sent at once ran out of order | Parallel tool calls | Apply migrations strictly one at a time |
| Logo tile bounds wrong | Glow specks and the navy wordmark counted as "tile" | Detect by rows/columns with a real run of navy; stop at the first gap |
| Navy read as black, yellow too loud | Brief's exact values on phone screens | Lift navy to `#173F6B`, soften yellow to `#F6DC8A`, more pastel surfaces |
| Pastel mood washes too strong for the heading | Alpha too high | Contrast audit now checks the heading over each mood |
| Share card build failed | It read photos that weren't in the repo | Literal photo paths; update them if photos change |
| Disabled button still clickable | Base UI's trigger overrides `disabled` from `render` | Put `disabled` on the trigger itself |
| `loading.tsx` at the app root flashed everywhere | Root loading is every route's fallback | Home lives in a `(home)` route group |
| "use server" file broke | It exported a constant | Server-action files export async functions only |
| Pages slow | Functions in US-East, DB in Mumbai | Pin `bom1` in `vercel.json` |
| Splash can't be seen in an embedded/hidden browser | It skips hidden tabs on purpose | Verify with headless Edge (CDP) instead |

---

## 11. Environment variables

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Vercel | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | local + Vercel (secret) | admin new-order push only |
| `ADMIN_PASSCODE` | local + Vercel (secret) | second admin lock; unset = nobody gets in |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | local + Vercel | web push public key |
| `VAPID_PRIVATE_KEY` | local + Vercel (secret) | web push private key |
| `GOOGLE_SITE_VERIFICATION` | Vercel (optional) | Search Console token |
| `NEXT_PUBLIC_SITE_URL` | optional | overrides the site URL (custom domain) |
| `NEXT_PUBLIC_DISABLE_SPLASH` | optional | `1` removes the splash |

Never commit a secret; never paste one into chat.

---

## 12. Still open

- **Switch the content policy to enforced** once a check of the `[csp]`
  logs after signed-in browsing comes back empty (one line in
  `next.config.ts`).
- **Publish the Google sign-in app** (out of "Testing") before real
  students sign in, if not done already.
- Restaurant phone numbers are the support number; set real ones if
  admins should call restaurants from the app.
- 30 dishes have no photo yet; covers are stock photos until the client
  sends real ones.
- Supabase performance suggestions (wrap `auth.uid()` in `select` inside
  policies, a few foreign-key indexes) — worth doing if order volume grows;
  any change goes through the schema hard rule.
- Automated WhatsApp confirmation — an idea only (see `CLAUDE.md`).
