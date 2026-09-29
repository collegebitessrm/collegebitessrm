# MuteBites — the complete build blueprint

Everything that was built for MuteBites, from the first commit to the last,
written so it can be rebuilt for another university. It covers what was
built, why each decision was made, how every piece is set up outside the
code, what broke along the way and how it was fixed.

Compiled 25 Sep 2026 from all 10 Claude sessions on this project, all 114
commits, all 35 database migrations, CLAUDE.md, the saved working notes and
the source code itself.

---

## College Bites port log

This repo is College Bites (SRM University AP), built from MuteBites
following this blueprint. Everything below is MuteBites' record and stays
as it was; this log lists where College Bites deliberately differs.

**Setup (29 Sep 2026)**
- Supabase project `cpatbcisnrvyjztyqutq` in `ap-south-1`; Vercel project
  `collegebitessrm` (Hobby), live at https://collegebitessrm.vercel.app;
  private repo `collegebitessrm/collegebitessrm`.
- Migrations applied through the Supabase connector (SQL shown and
  approved first), except `20260915020000_google_oauth_and_ban.sql`, run by
  hand. Skipped: every MuteBites menu migration, `…090000` (role rename
  fix), `…110000` (re-apply), `…19000000`/`…19010000` (schedule) and
  `…22000000` (folded into the new switch migration).
- **Lesson:** Vercel Hobby only builds commits authored by the project
  owner. The first push (authored by a personal git identity) showed
  "Blocked"; the repo's git author is now set locally to
  `collegebitessrm <collegebitessrm@gmail.com>`.
- The Supabase security advisor flagged mutable `search_path` on the
  trigger functions and signed-out access to `current_user_is_banned()`;
  fixed in `20260929000000` / `20260929020000` (a revoke from `anon` alone
  doesn't work — the grant comes through PUBLIC).

**No ordering schedule** (replaces section 10's schedule table)
- `app_settings.ordering_mode` is `'open' | 'closed'` only, flipped by the
  admin whenever they like; `place_order()` raises `ordering_paused` while
  closed (`ordering_closed` no longer exists).
- Delivery promise is per restaurant: `restaurants.delivery_minutes`
  (40 by default, Biryani Nation 60). The ticket says "Delivery by
  <placed + minutes>"; "Current orders" drops finished orders once that
  time passes; "Mark all delivered" delivers every confirmed order with
  no time gate.

---

## Contents

1. [How to use this for a new university](#1-how-to-use-this-for-a-new-university)
2. [Project snapshot](#2-project-snapshot)
3. [Timeline: everything, in order](#3-timeline-everything-in-order)
4. [How we worked (the rules)](#4-how-we-worked-the-rules)
5. [Setting everything up from zero](#5-setting-everything-up-from-zero)
6. [Architecture](#6-architecture)
7. [Database: every table, function, trigger and rule](#7-database-every-table-function-trigger-and-rule)
8. [Student app, screen by screen](#8-student-app-screen-by-screen)
9. [Admin panel, screen by screen](#9-admin-panel-screen-by-screen)
10. [Business rules in one place](#10-business-rules-in-one-place)
11. [Design system](#11-design-system)
12. [Logo, icons and the startup splash](#12-logo-icons-and-the-startup-splash)
13. [Notifications (web push)](#13-notifications-web-push)
14. [Performance](#14-performance)
15. [SEO](#15-seo)
16. [Security](#16-security)
17. [Restaurants, menus and photos](#17-restaurants-menus-and-photos)
18. [Problems we hit and how we fixed them](#18-problems-we-hit-and-how-we-fixed-them)
19. [Still open](#19-still-open)
20. [Porting checklist: every university-specific thing](#20-porting-checklist-every-university-specific-thing)
21. [Environment variables](#21-environment-variables)
22. [Starter prompt for the new project](#22-starter-prompt-for-the-new-project)
23. [Appendix A: all 114 commits](#appendix-a-all-114-commits)
24. [Appendix B: all 35 migrations](#appendix-b-all-35-migrations)

---

## 1. How to use this for a new university

**Fastest route: copy the repo, then change what's university-specific.**
Almost nothing in MuteBites is tied to VIT-AP except text, the gate name,
the schedule, the restaurants and their photos, the brand and a few
addresses. [Section 20](#20-porting-checklist-every-university-specific-thing)
lists every one of them with its file.

1. Copy the repository into a new one (don't fork the live repo's history
   into a public place; it's fine to start fresh with `git init`).
2. Create a **new** Supabase project and a **new** Vercel project. Never
   point the new app at MuteBites' database.
3. Follow [Section 5](#5-setting-everything-up-from-zero) step by step.
4. Apply the database in the order given in
   [Appendix B](#appendix-b-all-35-migrations) (skip the MuteBites menu
   data and the one-off fixes; they're marked).
5. Work through the porting checklist.
6. Give Claude the starter prompt in [Section 22](#22-starter-prompt-for-the-new-project)
   together with this file and the copied CLAUDE.md.

**If you'd rather rebuild from scratch,** this document is ordered the way
MuteBites was actually built (setup → auth → student flow → admin → polish
→ design → features → hardening), and every step names the files it
produced.

---

## 2. Project snapshot

| | |
|---|---|
| What | Food ordering site for VIT-AP University students |
| Live site | https://mutebites.vercel.app |
| Repo | https://github.com/MuteBites/mutebites (branch `main`) |
| Pickup | Everything is handed over at **VIT-AP Main Gate**. No room delivery. |
| Payment | **Cash on delivery only.** UPI is accepted informally at pickup; the app never processes payments. |
| Sign-in | "Continue with Google" only |
| Restaurants | 6: Bheemasena Restaurant (59 dishes), A1 Biryani Point (3), Bismillah Fruit Juice (12), Food Corner (24, was "MuteBites Chinese"), MuteBites Fresh Fruits (13), MuteBites Sugarcane Juice (1) |
| Stack | Next.js 16.3.5 (App Router, customised build), React 19.2.8, TypeScript, Tailwind CSS v4, shadcn/ui on `@base-ui/react`, lucide-react icons, Supabase (Postgres, Auth, RLS, Realtime), `web-push`, Vercel (Hobby plan) |
| Regions | Supabase `ap-south-1` (Mumbai), Vercel functions pinned to `bom1` (Mumbai) |
| Admin alerts go to | mutebites5@gmail.com |
| Support number | +91 82470 75652 (call + WhatsApp) |
| Built | 15–22 Sep 2026; launched to real students 20 Sep 2026 |
| Size | 114 commits, 35 migrations, 171 source files |

---

## 3. Timeline: everything, in order

### 15 Sep — Setup, auth, the whole student app, the admin panel

**Session "mutebites-setup-auth"**
- Scaffolded Next.js (TypeScript, Tailwind v4, App Router, ESLint, `src/`),
  added shadcn/ui and the Supabase SSR helpers (`client.ts`, `server.ts`,
  `middleware.ts`).
- Designed the first schema: `users`, `restaurants`, `dish_categories`,
  `dishes`, `orders`, `order_items`, RLS on everything, no payment fields.
- Created CLAUDE.md with the hard rule: **never change the database
  without showing the SQL first.**
- Added `role` (`student`/`admin`) plus `is_admin()`, admin write policies
  on menus, admin update on orders. Caught a hole straight away: the "edit
  own profile" policy would let a student set `role = 'admin'`. Fixed with
  the `prevent_role_self_escalation` trigger.
- **Tried email OTP first** (Supabase Auth + Resend SMTP). Resend needed a
  verified domain the client didn't want to pay for; Supabase's free
  mailer won't let you edit templates to show a 6-digit code without
  custom SMTP. **So OTP was dropped for "Continue with Google".**
- Set up Google OAuth (Google Cloud Console + Supabase provider),
  verified the round trip before writing any UI, confirmed `public.users`
  stays empty until the app creates the row.
- Added `is_banned`, then **changed bans to match by phone number, not
  account** (any account sharing a banned phone is blocked). Dropped the
  unique constraint on phone so several Google accounts can share one.

**Session "mutebites-student-flow"** — 7 screens, one at a time, each
approved before the next:
1. Sign-in page. Found the session code wasn't running
   (`middleware.ts` must live in `src/`, and this Next.js calls it
   `proxy.ts`), and there was no `/auth/callback` route; added both.
2. First-login form (full name + phone). Dropped hostel block/room from
   `users` and `orders` entirely: everyone collects at the Main Gate.
3. Home / restaurant list.
4. Menu page (sections, add-to-cart with a stepper, sold-out dishes shown
   but not addable).
5. Cart sheet, then **`place_order()`**: a database function that is the
   only way to create an order. Students lost their direct insert rights.
6. Seeded the 3 real restaurants (41 + 3 + 14 dishes). "Single Special
   Biryani" renamed to "Single Special Chicken Biryani" and marked non-veg.
7. Order confirmation + status timeline, then order history.
- Delivery-time line on the ticket, computed only from when the order was
  placed. "Call MuteBites" wording instead of the restaurant's name.
- Profile page with light/dark/system theme, editable name and phone,
  locked email.
- Phone-edit rules: blocked while an order is open, blocked permanently
  if banned (otherwise a banned student could change number and escape
  the ban). Enforced in the database by extending the trigger.
- First commit of the app; cart cleared on sign-out.

**Session "mutebites-admin"**
- Admin gate (`requireAdmin()`), stat cards, campus ordering switch,
  restaurant open/closed toggles. New `app_settings` table.
- Hit a live drift: the `role` column had been renamed to `student` by
  accident in Supabase's Table Editor. Renamed it back and recorded the
  fix as a migration.
- Orders list, WhatsApp button, status advance, bans. Admins got read
  access to users and order items.
- Simplified status to two admin clicks: **Confirm** (pending →
  confirmed) and **Mark delivered** (confirmed → delivered).
- Found the ordering switch wasn't blocking orders (the function part of
  a migration had never run); re-applied `place_order()`. Paused state now
  shows everywhere on the student side.
- Moved banning out of order cards into a Banned Users section; added
  `banned_at`.
- CSV "Export to Excel", "Mark all delivered" gated by the delivery slot
  having ended.
- **Second admin layer: a passcode** (`ADMIN_PASSCODE` env var, session
  cookie, fails closed if unset). Order filters: restaurant tabs, search,
  status dropdown, "Showing X orders". Cancel order.
- Pushed to GitHub for the first time (had to add the GitHub user as a
  collaborator first).
- Veg-only toggle, dish search, loading skeletons, **live order tracking
  over Supabase Realtime**. Discovered that a `loading.tsx` at the app
  root becomes the fallback for every page, so Home moved into a `(home)`
  route group.

### 16 Sep — Polish, photos, gamification, daily token numbers

**Session "mutebites-polish"** — a UI/UX plan in three buckets (build now,
needs photos, flagged). Built one at a time:
- Micro-interactions, toasts instead of inline errors, order-placed
  success moment, view transitions between pages, installable app
  (manifest + icons; the icon routes had to be let past the sign-in
  redirect).
- Gamification: milestone badges, pickup/no-show count, "You've tried N
  of M" menu progress, "Your usual" one-tap reorder chip, Thursday special
  banner, first-order confetti. A 5-angle code review followed and its
  real findings were fixed.

**Session "mutebites-polish2"**
- Real photography: ~90 dish photos under `public/MuteBites/<restaurant>/`,
  cover photos, a hand-checked name → photo map (`dish-photos.ts`).
- Two new restaurants: MuteBites Chinese (24) and MuteBites Fresh Fruits
  (13).
- A stubborn stale-photo problem, finally solved by giving changed photos
  **new filenames (`-v2`)**.
- Admin restaurant cards show "Paused" when campus ordering is off.
  Green Open / red Closed / orange Paused.
- **Sequential daily token numbers** (#1, #2, … per IST day,
  campus-wide) via a counter table and trigger, shown identically to the
  student and the admin. Admin split into Today and Order history.
- "Your usual" hidden while ordering is paused. Tapping the Home logo
  opens an "About MuteBites" popup (with the informal UPI line). Removed
  the top-right profile menu from Home.
- "Trending this week" popup (`trending_dishes()`), streak, favourite-dish
  tag, weekly rank (`my_weekly_rank()`), privacy and terms pages for
  Google's OAuth review.

### 17 Sep — Speed, profile rework

**Session "mutebites-polish3"**
- Profile overhaul: loading skeleton, support card (call + WhatsApp),
  icon-only theme control, sign-out confirmation with "Glad to have you
  back!", milestone rings.
- **Slow pages (2–3 s) diagnosed and fixed:** Vercel's functions were
  running in Virginia while the database is in Mumbai. Pinned the region
  to `bom1` in `vercel.json`, removed a duplicate `auth.getUser()` per
  request, and started independent queries in parallel. Home went from
  2.7 s to 0.3 s.
- "Glad to have you back!" toast on re-sign-in. Theme default changed to
  follow the phone. "Highly re-ordered" dish tag. Confirm/Cancel side by
  side, Cancel hidden after confirming, "Mark all delivered" always
  visible. UPI line and WhatsApp-number reminder in the cart. Weekly rank
  percent replaced with tier names. The WhatsApp auto-confirm idea
  written up as a pending decision.

### 18 Sep — Logo, users page, the 15-step redesign begins

**Session "mutebites-polish4"**
- Real MuteBites logo for the tab icon and install icons. Admin Users page
  (with Banned users one level deeper). WhatsApp-number hint on the
  first-login form. Standing instructions set: commit and push every
  change, check changes on the live site, never on localhost.

**Session "mutebites-design-makeover"** — a 15-step redesign, each step
approved on the phone before the next:
1. Plum/amber/rose colour tokens with real surface layers.
2. Fraunces display font, named type sizes, no mono labels.
3. Photo-mosaic sign-in screen.
4. Home header as a time-of-day mood field.
5. Photo-collage restaurant cards.
6. Photo-grid menu, corner add button, one sticky filter row.
7. Photo cart bar; cart sheet that no longer clips.
8. Order tracking as a photo ticket stub.
9. Orders list grouped by day.
10. Plum member card, six milestones.
11. Branded 404 and error pages, photo empty states.
12. Photo Trending popup with dish deep links; every emoji replaced with
    lucide icons.
13. Motion tokens and a reduce-motion safety net (Vercel had an outage
    mid-step; learned to check vercel-status and use the Vercel CLI).
14. Admin panel on the same design system.
15. QA: full contrast audit (and the audit script), headings, robots.txt,
    login load speed.

### 19 Sep — Schedule, dish search, ratings, splash

- **Daily ordering schedule** with a three-way admin switch
  (Auto/Open/Closed). The old on/off switch removed.
- Home search finds dishes, not just restaurants, and deep-links to them.
- **Ratings**, in 4 steps: schema; rate a delivered order (stars per dish
  + note, no photos); "Rate" pill + one-time Home pop-up; admin Reviews
  page.
- Milestone unlocks get the full-screen celebration. "Pending
  confirmation" wording on the ticket.
- **Restaurant cards auto-slide** from the cover through the most-ordered
  dishes; tapping a dish opens it.
- Bismillah's catch-all juice items removed.

**Session "mutebites-redesign"**
- New logo everywhere, a generated set of brand assets, and a **startup
  splash** where the mascot actually runs in and lands in the app's own
  logo tile. Theme applied before first paint (no light flash in dark
  mode).

### 20 Sep — Launch to real students; menu updates

- Veg / Non-veg filters. "MuteBites Chinese" renamed **Food Corner**.
  Single Mushroom Biryani ₹220 → ₹200. "Comes with both dum & fry pieces"
  note on mixed biryanis. New photos. Mutton Afghani and Prawn biryanis,
  then 16 more Bheemasena dishes (59 total).

### 21 Sep — Sold out, notifications, rewards, admin rework, SEO, security

- Admin **Sold out** page for per-dish availability.
- **Web push notifications**: students get confirmed/delivered/cancelled;
  the admin gets a loud new-order alert.
- **Free-biryani reward** card for completing all six milestones, then
  claim tracking (`milestone_rewards`, "Mark claimed" on the admin Users
  page, only for students who've earned it).
- Admin rework: main page shows **current orders only** (until their
  delivery window ends); order cards list each dish on its own line with
  a copy button; clearer WhatsApp text; pausing ordering turns every
  restaurant off, and turning one back on asks to reopen ordering first.
- Order details page for the admin; the card's order box shows name and
  number; copy text trimmed to restaurant, dishes, name, number.
- **Trending cleaned up:** ignores orders before launch and from banned
  phone numbers (the test accounts were banned).
- **SEO basics:** page details, share image, sitemap, robots, "don't
  index" on private pages, Google Search Console.
- **Security:** npm audit (0 issues), security headers, content policy in
  report-only mode with a violation log.

### 22 Sep — Rate limits, sixth restaurant

- `place_order()` rate limits: 5 orders a minute, 8 unfinished orders.
- Supabase sign-in limits reviewed (raise sign-ins to ~100 per 5 min
  because campus Wi-Fi shares one IP).
- MuteBites Sugarcane Juice added (one dish, ₹90).

---

## 4. How we worked (the rules)

These made the project go smoothly. Keep them for the new one.

1. **Show the SQL first.** Never change the database without showing the
   exact SQL in chat and getting a clear go-ahead. After approval, add a
   new timestamped file in `supabase/migrations/`, never edit an applied
   one, and update CLAUDE.md's schema section.
2. **Migrations are run by hand** in the Supabase SQL editor. There is no
   Supabase CLI and no database password on the dev machine. Claude writes
   the file; you paste and run it, in timestamp order. Run data inserts
   only once.
3. **One step at a time.** Build it fully, check it (build, lint,
   `npm run audit:contrast`, light and dark, 320 px), say exactly what to
   test, then wait for "go" before the next step. "Plan mode" means a plan
   only, with draft SQL, and nothing built.
4. **Commit and push every change** to `main`; Vercel deploys it in ~30 s.
   Update CLAUDE.md in the same commit when something it documents
   changes. Batch small follow-up fixes into one push (the free plan allows
   100 deploys a day and builds one at a time).
5. **Check on the live site, not localhost.** Signed-in pages can't be
   reached by Claude's browser, so hand the signed-in check to the user
   with exact steps. Never sign in as the user.
6. **This is a customised Next.js.** Read `node_modules/next/dist/docs`
   before using an API you're unsure of (examples: `proxy.ts` instead of
   `middleware.ts`, error boundaries get `retry` not `reset`,
   `PageProps<"/route">` types, `after()`).
7. **The database is the real security boundary.** Every app-side check is
   repeated in RLS, a trigger or a security-definer function, because
   anyone can call Supabase's REST API directly with their own token.

---

## 5. Setting everything up from zero

### 5.1 Code
```bash
npx create-next-app@latest <name> --ts --tailwind --eslint --app --src-dir
npx shadcn@latest init
npm i @supabase/ssr @supabase/supabase-js lucide-react web-push server-only
npm i -D @types/web-push
```
(Or copy this repo, which already has all of it.)

### 5.2 Supabase
1. Create a project **in the region closest to your students** (MuteBites:
   `ap-south-1`, Mumbai). Note the region; Vercel must match it.
2. Project Settings → API: copy the URL and the anon key into
   `.env.local` (and later Vercel). Copy the service-role key into
   `SUPABASE_SERVICE_ROLE_KEY` (server only; used only for admin push).
3. Run the migrations (Appendix B) in the SQL editor, in order.
4. **Authentication → Sign In / Providers → Google:** enable, paste the
   Google Client ID and Secret (5.3). This page shows the callback URL
   Google needs.
5. **Authentication → URL Configuration:** Site URL = your live URL. Add
   redirect URLs `http://localhost:3000/**` and `https://<your-domain>/**`.
   The app's callback is `/auth/callback`.
6. **Authentication → Rate Limits:** raise "sign-ups and sign-ins" from
   30 to ~100 per 5 minutes (campus Wi-Fi puts hundreds of students behind
   one IP). Leave the rest.
7. Sign up once through the app, then make yourself admin in the SQL
   editor:
   ```sql
   update public.users set role = 'admin' where email = '<your email>';
   ```
   **Don't rename columns in the Table Editor** (that's how `role` got
   renamed to `student` by accident). Use SQL.

### 5.3 Google Cloud (sign-in)
1. console.cloud.google.com → new project.
2. APIs & Services → **OAuth consent screen**: External; app name, support
   email, developer email; default scopes (`openid`, `email`, `profile`).
   Add your **privacy** and **terms** URLs (`/privacy`, `/terms`) — Google's
   review needs them, which is why those two pages are public.
3. While "Testing", only listed test users can sign in. **Publish** before
   real students use it.
4. Credentials → **OAuth client ID** → Web application. Authorized
   redirect URI = the Supabase callback
   (`https://<project-ref>.supabase.co/auth/v1/callback`), not your app's.
5. Put the Client ID and Secret into Supabase (5.2 step 4).

### 5.4 Vercel
1. Import the GitHub repo. Add every environment variable from
   [Section 21](#21-environment-variables).
2. **Pin the function region** to match Supabase in `vercel.json`:
   `{ "regions": ["bom1"] }` (or the region nearest your database). Without
   this, functions run in US-East and every page is 2–3 s slower.
3. Every push to `main` deploys. The Vercel CLI works via
   `npx -y vercel@latest` (`ls <project>`, `inspect <url> --logs`,
   `redeploy <url>`). If a deploy sits on "Initializing" with no logs, check
   https://www.vercel-status.com before redeploying.

### 5.5 GitHub
Create the repo, add the developer's GitHub account as a collaborator
(pushing failed with a 403 until that was done), push `main`.

### 5.6 Web push keys
```bash
npx web-push generate-vapid-keys
```
Public key → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, private key →
`VAPID_PRIVATE_KEY` (never `NEXT_PUBLIC_`). Set the admin alert address in
`ADMIN_ALERT_EMAILS` (`src/lib/notifications/send.ts`).

### 5.7 Admin passcode
Set `ADMIN_PASSCODE` in `.env.local` and in Vercel. With it unset, **no one
can enter /admin** (fails closed). Never commit it, never paste it in chat.

### 5.8 Google Search Console
Add a URL-prefix property for the live URL, choose "HTML tag", copy only
the `content` token into `GOOGLE_SITE_VERIFICATION` in Vercel (a normal
variable, not sensitive — it's public in the page), redeploy, click Verify,
then submit `sitemap.xml` and request indexing for `/login`.

---

## 6. Architecture

### 6.1 Routes
| Route | What | Access |
|---|---|---|
| `/login` | Photo-mosaic sign-in, "Continue with Google" | public |
| `/auth/callback` | Swaps Google's code for a session → `/?signedIn=1`, or `/login?error=auth` | public |
| `/welcome` | First-login form (full name + phone), shown once | signed in, no profile yet |
| `/` (`src/app/(home)/page.tsx`) | Home | student |
| `/restaurants/[id]` | Menu (`?dish=<id>` deep link) | student |
| `/orders` | Order history | student |
| `/orders/[id]` | Tracking ticket (`?placed=1` success moment, `?rate=1` opens rating) | student |
| `/profile` | Member card, milestones, reward, details, settings | student |
| `/privacy`, `/terms` | Static policy pages | public |
| `/admin` | Dashboard | admin + passcode |
| `/admin/history` | Every order, grouped by day | admin |
| `/admin/orders/[id]` | Order details | admin |
| `/admin/users` | All students (+ reward claims) | admin |
| `/admin/banned` | Banned list, ban search | admin |
| `/admin/reviews` | Ratings | admin |
| `/admin/sold-out` | Per-dish availability | admin |
| `/api/csp-report` | Logs content-policy violations | public |
| `/manifest.webmanifest`, `/icons/*`, `/apple-icon`, `/favicon.ico` | Install icons | public |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | SEO | public |

### 6.2 The sign-in guard
- `src/proxy.ts` (this Next.js's name for middleware) calls
  `updateSession()` in `src/lib/supabase/middleware.ts` on every request:
  refreshes the session with `auth.getUser()`, sends signed-out visitors to
  `/login` and signed-in visitors away from `/login`.
- `PUBLIC_PATHS` = `/login`, `/auth`, `/privacy`, `/terms`.
- The **matcher skips** static files, images, `favicon.ico`, `robots.txt`,
  `sitemap.xml`, `opengraph-image`, `api/csp-report`, `sw.js`,
  `manifest.webmanifest`, `apple-icon`, `icons/`. Anything a browser,
  phone, bot or crawler fetches while signed out must be on this list, or
  it gets a redirect to `/login` instead of the file.
- Pages call `requireProfile()` (`src/lib/profile.ts`): signed out →
  `/login`, no `users` row → `/welcome`. It reads the session with
  `getSession()` (a local cookie read) because the proxy already verified
  it with `getUser()`; calling `getUser()` twice was the main slowness.
  Cached per request with React `cache()`.
- Admin pages: `requireAdmin()` (`src/lib/admin/guard.ts`) then the
  passcode check in `src/app/admin/layout.tsx`.

### 6.3 Data and writes
- Reads: server functions in `src/lib/data/*` using the server Supabase
  client (`src/lib/supabase/server.ts`), under the student's own RLS.
- Writes: server actions (`"use server"` files may only export async
  functions — constants go in a separate module, e.g. `phone-lock.ts`).
  - Orders → `src/lib/orders/actions.ts` → `place_order()` RPC.
  - Reviews → `src/lib/reviews/actions.ts` → `submit_review()` RPC.
  - Profile → `src/app/profile/actions.ts`; first login →
    `src/app/welcome/actions.ts`.
  - Admin → `src/lib/admin/actions.ts` (each checks admin first; RLS is
    the real boundary).
  - Push subscriptions → `src/lib/notifications/actions.ts`.
- The service-role client (`src/lib/supabase/admin.ts`) is used in exactly
  one place: finding the admin's devices for the new-order push.
- Slow side effects (push sends) run in `after()` so they never hold up the
  response and never throw.

### 6.4 Browser-side state (no database)
Small stores built on `useSyncExternalStore`: cart
(`src/lib/cart/store.ts`), theme (`src/lib/theme/store.ts`), toasts
(`src/lib/toast/store.ts`), sound (`src/lib/sound/store.ts`).

Saved on the device (localStorage / sessionStorage):

| Key | What |
|---|---|
| `mutebites.cart.v1` | The cart: restaurant, dish ids, quantities, prices shown |
| `mutebites.theme` | light / dark / system (default system) |
| `mutebites.sound-enabled` | "Order placed" chime on/off |
| `mutebites.admin-alert-sound` | Admin's loud new-order alarm on/off |
| `mutebites.confetti-shown` | First-order confetti already played |
| `mutebites.milestones-seen` | Milestones already celebrated on this device |
| `mutebites.notify-asked` | "Get a ping" card already shown |
| `mutebites.rate-prompted` | Home rating pop-up already shown |
| `mutebites.splash-shown` (sessionStorage) | Splash already played this session |
| `mutebites.splash` = `"off"` | Disable the splash on one device |

Sign-out clears the cart first (`src/lib/sign-out.ts`), so a shared phone
never shows the previous student's cart.

### 6.5 Folder map
- `src/app` — routes; `src/components/{admin,cart,home,menu,orders,profile,notifications,splash,theme,toast,ui,nav}`
- `src/lib/{admin,cart,data,notifications,orders,reviews,sound,supabase,theme,toast}` plus `date.ts`, `ordering.ts`, `phone.ts`, `search.ts`, `site.ts`, `support.ts`, `format.ts`, `ids.ts`
- `supabase/migrations/` — the database, in order
- `scripts/contrast-audit.mjs`, `scripts/build-brand-assets.mjs`
- `public/MuteBites/<restaurant>/` photos, `public/MuteBites/covers/`, `public/brand/`, `public/sw.js`

---

## 7. Database: every table, function, trigger and rule

RLS is on for every table. Anything a student could do through the app,
they could also try directly through Supabase's REST API with their own
token, so every rule lives in the database.

### 7.1 Tables
**`users`** — one row per Google account, same `id` as `auth.users`
(cascade delete). Created by the app when the first-login form is
submitted; that's how first-time vs returning is told apart.
- `full_name` (not null), `phone` (not null, **not unique**, always
  `+91XXXXXXXXXX` via `normalizeIndianMobile()`), `email` (not null, unique,
  **any Google account allowed** — no college-domain restriction, by
  decision), `registration_number`, `role` (`user_role`: student/admin,
  default student), `is_banned` (default false), `banned_at` (kept right by
  a trigger), `created_at`.
- RLS: students read/insert/update their own row; admins read and update
  all rows.

**`restaurants`** — `name`, `phone`, `description`, `cuisine_tags text[]`,
`is_active`. Public read; admin write.

**`dish_categories`** — menu sections per restaurant, `sort_order`. Public
read; admin write.

**`dishes`** — `restaurant_id`, `category_id`, `name`, `price`, `is_veg`,
`note` (e.g. "Thursday Only", "Comes with both dum & fry pieces"),
`is_available` (the Sold out flag), `sort_order`. Public read; admin write.

**`orders`** — `user_id`, `restaurant_id`, `status` (`order_status`:
pending → confirmed → preparing → out_for_delivery → delivered, or
cancelled; the app only uses pending → confirmed → delivered and
cancelled), `contact_phone`, `notes`, `total_amount`, `daily_number`
(the token), `delivered_at`, `created_at`, `updated_at`. **No payment
fields.** Students read their own; admins read all and update all;
**nobody inserts directly** — only `place_order()`. In the Realtime
publication so the ticket updates live.

**`order_items`** — snapshots `dish_name` and `unit_price` at order time,
`quantity`, generated `subtotal`; `dish_id` set null if the dish is
deleted (history never changes). Students read their own; admins all.

**`daily_order_counters`** — `order_day` (IST date, PK), `last_number`.
RLS on with no policies; only the trigger writes it.

**`app_settings`** — exactly one row (`id boolean primary key default true
check (id)`), `ordering_mode` `'auto' | 'open' | 'closed'`. Public read;
admin update.

**`order_reviews`** — `order_id` (PK), `user_id`, `note` (≤ 300),
`created_at`. **`order_item_ratings`** — `order_item_id` (PK), `order_id`,
`dish_id`, `rating` 1–5. Students read their own; admins read all; the
only write path is `submit_review()`. Never shown to other students.

**`push_subscriptions`** — `user_id`, unique `endpoint`, `p256dh`, `auth`,
`user_agent`. Students manage their own; admins read all and delete stale.

**`milestone_rewards`** — `user_id` (PK = once per student), `claimed_at`,
`marked_by`. Students read their own; admins read, insert (with
`marked_by = auth.uid()`) and delete (undo). No update.

### 7.2 Functions
| Function | What | Who can call |
|---|---|---|
| `is_admin()` | caller's role is admin | used in policies |
| `current_user_is_banned()` | **any** users row with the caller's phone is banned | used by `place_order()` |
| `ordering_schedule_open()` | is the IST clock inside an ordering window | internal |
| `ordering_is_open()` | combines mode + schedule; the single source of truth | anon + authenticated |
| `place_order(restaurant_id, items jsonb, contact_phone, notes)` | the only way to create an order | authenticated |
| `submit_review(order_id, ratings jsonb, note)` | the only way to rate | authenticated |
| `trending_dishes(days_back=7, result_limit=5)` | top dishes campus-wide, counts only | authenticated |
| `highly_reordered_dishes(min_repeat_students=3, result_limit=10)` | dishes 3+ students each ordered 3+ times | authenticated |
| `my_weekly_rank(days_back=7)` | the caller's own rank/percentile only | authenticated |

The last three are **security definer** (they read across students) but
return only counts, never who ordered what.

**`place_order()` checks, in order:** signed in → has a profile →
`ordering_is_open()` (else `ordering_paused` if forced closed, otherwise
`ordering_closed`) → not banned by phone → **rate limit** (per-student
advisory lock; ≥ 5 orders in the last minute → `order_rate_limited`; ≥ 8
unfinished → `too_many_open_orders`) → phone format `^\+91[6-9][0-9]{9}$`
→ notes ≤ 200 → restaurant active → cart not empty → each quantity 1–20,
no duplicate dishes → every dish belongs to the restaurant and is
available → insert with prices **taken from `dishes`, never the browser**
→ total computed in the database.

Error keys (mapped to friendly text in `src/lib/orders/actions.ts`):
`not_authenticated`, `profile_missing`, `ordering_paused`,
`ordering_closed`, `banned`, `order_rate_limited`, `too_many_open_orders`,
`invalid_contact_phone`, `notes_too_long`, `restaurant_closed`,
`empty_cart`, `invalid_items`, `dish_unavailable`.

**`submit_review()` checks:** caller owns the order, it's delivered,
`delivered_at` within 7 days, not already reviewed, exactly one 1–5 rating
per item. Keys: `order_not_found`, `not_delivered`,
`review_window_closed`, `already_reviewed`, `note_too_long`,
`invalid_ratings`.

**`trending_dishes()`** skips cancelled orders, inactive restaurants,
unavailable dishes, **orders before launch (20 Sep 2026 IST)** and
**orders from banned phone numbers**.

### 7.3 Triggers
- `prevent_role_self_escalation` (before update on users): blocks any API
  change to `role`; blocks `is_banned` changes unless the caller is admin;
  blocks `phone` changes if the account is banned (permanent) or has an
  unfinished order (temporary). The SQL editor is unaffected.
- `set_banned_at`: sets/clears `banned_at` when `is_banned` flips.
- `set_daily_order_number` (before insert on orders): atomic upsert on
  `daily_order_counters` → `new.daily_number`. Race-free; never computed
  by counting on read.
- `set_delivered_at`: stamps `delivered_at` when status becomes delivered.

---

## 8. Student app, screen by screen

### Sign-in (`/login`)
Tilted 3-column mosaic of real dish photos fading into the page, logo tile
(the splash lands here), "Good food. Campus mood.", a one-line pitch,
"Continue with Google" (always shows Google's account picker), a sign-in
error line, Terms and Privacy links. Carries the full search title,
canonical link and business details for Google.

### First-login (`/welcome`)
Full name (pre-filled from Google) and phone, with "Make sure this is your
WhatsApp number" beside the phone hint and a line that everything is
collected at the Main Gate. Creates the `users` row. Returning users never
see it again.

### Home (`/`)
- **Mood header** that bleeds to the screen edges and changes with IST
  time of day (morning 5–12, afternoon 12–17, evening 17–21, night),
  greeting heading, logo (tap → "About MuteBites" popup: what it is,
  cuisines, cash on delivery, UPI at pickup, Main Gate), flame button
  → **Trending this week** popup (#1 as a big photo, #2–5 as rows, each
  linking to the dish).
- **Search** across restaurants and dishes (~100 dishes ship with the
  page): every typed word must start a word in the dish, its section or
  its restaurant; "veg"/"non veg" filter by the veg flag. Dishes show
  first, then restaurants that match or serve a match.
- **Ordering banner** when ordering is closed or paused ("Ordering opens
  again at 1:30 PM").
- **"Your usual"** chip: the student's most-repeated exact cart (at least
  twice), refilled in one tap; hidden while ordering is closed.
- **Thursday special** banner on Thursdays (IST), data-driven from dish
  notes containing "Thursday".
- **Rate prompt:** one-time pop-up for the latest unrated delivered order.
- **"Glad to have you back!"** toast after re-sign-in (`?signedIn=1`).
- **Restaurant cards**: cover photo first, then up to five dish photos
  sliding by (most ordered in the last 30 days first, then hand-picked
  signature dishes), each with a veg mark, name and price; tap a dish to
  open it in the menu. Cover holds 2.5 s (+0.7 s per card down the list),
  dishes 3.2 s; time only counts while visible; pauses 8 s after a touch;
  no autoplay under reduced motion or when closed. Cuisine line, "24
  dishes · from ₹60", Open/Closed/Paused chip. "Free delivery to VIT-AP
  Main Gate" strip.
- Bottom tab bar: Food, Orders, Profile.

### Menu (`/restaurants/[id]`)
- Cover hero, restaurant name, description, Open chip, "You've tried N of
  M" progress bar.
- **One sticky filter row:** search icon, then Veg / Non-veg (mutually
  exclusive, only if the menu has both) and the section chips.
- Photo-grid dish cards with a corner add button that becomes a − n +
  stepper; veg/non-veg mark; note; **"Your favorite"** or **"Highly
  re-ordered"** tag; sold-out dishes greyed, struck through, not
  addable.
- `?dish=<id>` scrolls that dish into view and outlines it in rose for
  ~3 s.
- Adding from a different restaurant asks to start a new cart (one
  restaurant per order).
- Paused/closed states say so on the page and on each dish.

### Cart (bottom sheet from the cart bar)
- Cart bar: up to two overlapping dish photos, item count, total, View
  cart (photos hidden under 360 px).
- Sheet: each line with photo, stepper (max 20), line total; notes (max
  200); **"Your number"** with "Make sure this is your WhatsApp number
  before placing the order" and Change; bill card (Item total, Delivery
  Free, To pay at pickup); "Cash at the gate — exact change helps." and
  "UPI works too — scan and pay when you collect."; only the Place order
  button is pinned.
- Before calling the database, the server compares the cart with the live
  menu: removed/sold-out dishes are dropped from the cart and prices
  updated, with a message. The cart is only cleared after success.

### Order placed → tracking ticket (`/orders/[id]`)
- Full-screen **celebration overlay** (plum, confetti unless reduced
  motion, chime), first-order confetti once per device.
- **Ticket stub:** up to three dish photos on top, restaurant and time,
  **Live** dot while Realtime is connected, dashed tear line with notches,
  "Show this token" **#N**, delivery window ("Delivery by 1:30 PM" —
  the time never wraps), "Collect at VIT-AP Main Gate".
- Timeline: Order placed → Pending confirmation / Restaurant confirmed →
  Preparing & out for delivery → Delivered; cancelled orders get a red
  state.
- Your order: each dish with photo, quantity, total "To pay at pickup".
- One-time "Get a ping" card to turn on notifications.
- "Something wrong? Contact MuteBites" with Call and WhatsApp.
- Once delivered: **rating card** → bottom sheet with 1–5 stars per dish
  (all required) and an optional note; then "You rated this".
- Live via Realtime; a plain refresh always shows the true status.

### Orders (`/orders`)
"In progress" cards pinned on top (photo, dishes, token, Track order),
then compact rows grouped by day ("Today", "Yesterday", "Thu 17 Sep") with
a photo, dishes, Delivered/Cancelled, time and token, a small Reorder
button, and an amber "Rate your order" pill on rateable orders.

### Profile (`/profile`)
- **Plum member card:** initials, name, "Member since", weekly-rank pill
  (Top orderer ≤10% / Frequent ≤25% / Active ≤50%, only with ≥5 students
  that week), three stats: cravings solved (delivered), day streak,
  no-shows (cancelled).
- **Milestones:** six tiles in a 3×2 grid with "N of 6" and "Next up",
  locked tiles show a progress ring, a lock and "N to go"; new unlocks
  play the celebration overlay once per device.
- **Free-biryani card:** "A free biryani is waiting … N to go" → "You've
  earned a free biryani! Message us to claim it" (WhatsApp with a typed
  message) → "Free biryani claimed, handed over on 21 Sep".
- **Your details:** name (editable), phone (editable unless an order is
  open or the account is banned, with the reason shown), email (locked),
  handover point.
- **Settings:** appearance (sun/moon/monitor icons), order notifications
  switch, order-placed sound switch.
- Support card (Call + WhatsApp), Sign out with a confirmation.

### 404 and errors
"Token #404" lost-ticket page ("Nobody's coming to collect this one"),
error page with Try again and a ref code, self-contained global error
page. A malformed id is a 404, not a database error. Empty states: fanned
dish photos for empty cart/orders, an icon for no-match states.

### Privacy and Terms
Static, public, plain English; privacy explains ratings/notes are
admin-only.

---

## 9. Admin panel, screen by screen

**Access:** Google sign-in + `role = 'admin'` + the passcode (httpOnly
session cookie scoped to `/admin`). Header with Reload and Sign out.

### Dashboard (`/admin`)
- **Plum "Today" card:** today's orders, confirmed, completed,
  restaurants open; footer = **ordering switch** Auto / Open / Closed with
  a live status line ("Following the schedule — open until 12:45 PM").
  Each choice has a confirmation. **Closed also turns every restaurant
  off**; reopening leaves them off.
- Pills: Order history, Users, Reviews, Sold out; "Tap to arm sound" and
  sound toggle for the **loud new-order alarm** (Realtime inserts,
  repeating sound, count, list refresh).
- **Restaurants:** cover photo, Open (green) / Closed (red) / Paused
  (orange) with a note, Turn on/off. Turning one on while Closed asks
  "Ordering is closed … open ordering now?" → sets Auto if the schedule is
  open, otherwise Open, and turns that restaurant on.
- **Current orders:** today's orders until their delivery window ends;
  unfinished ones stay until done. The page refreshes itself when a window
  ends. "Mark all delivered" (only orders whose window has ended, says
  why when disabled).
- **Order card** (tap anywhere → details page): token, dish photo, time,
  status badge; "From <restaurant>" box with one line per dish ("A1
  Biryani Dum Biryani - 1" + price), the note, name and number; total;
  **copy** button; **WhatsApp** button; Confirm + Cancel side by side
  while pending, only Mark delivered after confirming.
- Filters on every order list: restaurant tabs, search (token, name,
  phone), status dropdown, "Showing X orders for …", CSV export of the
  filtered list.

**WhatsApp message** (`src/lib/orders/admin-text.ts`):
```
Hi <full name>, this is MuteBites — confirming your order #<n>
from <restaurant>:
<dish> - <qty> (₹<subtotal>)
[Total: ₹<total>  ← only with more than one dish]
Do you want to go ahead with this order? Reply yes to confirm.
```
**Copy text:** restaurant / each "dish - qty" / name / number. Nothing
else.

### Order details (`/admin/orders/[id]`)
Timing (placed, delivery window, delivered), student (phone, registration
number, email, Call / WhatsApp / Copy), each dish with price each,
subtotal and the student's stars, total, note, review note, and the same
action buttons.

### History, Users, Banned, Reviews, Sold out
- **History:** every order (up to 2000), grouped by day, same filters.
- **Users:** everyone, searchable; "Free biryani earned · N due" filter;
  earned students get "Mark claimed" (confirm) and Undo; link to Banned.
- **Banned:** banned list with Unban, search to ban (with a warning that
  it blocks the phone number campus-wide).
- **Reviews:** dish averages (lowest first) and review cards; filter by
  restaurant, "Needs attention" (any dish ≤ 2★), "With notes".
- **Sold out:** every dish grouped by restaurant and section, restaurant
  tabs, search, "Sold out only"; each row flips `is_available` in place.

---

## 10. Business rules in one place

### Ordering schedule (IST) and delivery windows
| Placed | Ordering | Delivery by |
|---|---|---|
| 10:30 AM – 12:45 PM | open | 1:30 PM |
| 12:45 – 1:30 PM | closed | — |
| 1:30 – 6:00 PM | open | 7:30 PM |
| 6:00 – 7:00 PM | open | 8:15 PM |
| 7:00 PM – 10:30 AM | closed | only if admin forces Open → "to be confirmed" |

Lives in three places that must change together: `ordering_schedule_open()`
(SQL), `src/lib/ordering.ts` (wording), `deliveryWindow()` / `slotEndTime()`
(`src/lib/date.ts`). All times are IST (fixed +5:30).

### Tokens
`#1, #2, …` per IST day, across all restaurants, from the database
trigger. Student and admin always see the same number.

### Bans
By phone number: if any account with that phone is banned, no account with
that phone can order. A banned account can't change its phone. Accepted
trade-off: a shared phone blocks both students.

### Milestones (never re-lock)
| Milestone | Needs |
|---|---|
| First Bite | 1 delivered order |
| Regular | 10 |
| Campus Explorer | a delivered order from every active restaurant |
| Campus Foodie | 25 |
| Gate Legend | 50 |
| Centurion | 100 |

All six → one free biryani of their choice, claimed on WhatsApp, marked
once by an admin.

### Limits
Cart: 20 per dish, 200-character notes. Orders: 5 per minute, 8 unfinished
at once. Reviews: within 7 days of delivery, 300-character note, once per
order. Trending: last 7 days, top 5 (card slides use 30 days). Highly
re-ordered: 3+ students who each ordered it 3+ times. Weekly rank: shown
only in the top half and with ≥5 students.

---

## 11. Design system

- **Colours** (`src/app/globals.css`): plum `#552C4A` is ink; amber
  `--primary #A25E1D` for every action (a shade darker than the approved
  `#A9631F`, which failed contrast as text); rose `#914955` accent;
  blush/lavender tint surfaces only; raw amber `#C07A35` decorative only.
  Fixed 100–900 ramps plus semantic tokens that flip per theme — use the
  semantic ones. Surfaces: background → card → popover with
  `shadow-card` / `shadow-raised` / `shadow-overlay`.
- **Rules:** text on a filled colour uses its `*-foreground` token, never
  `text-white`; no `text-primary` on blush; on plum use
  `text-ink-accent` / `-ink-success` / `-ink-danger`; focus rings
  `ring-ring/80`; input borders `--input`.
- **Contrast audit:** `npm run audit:contrast` checks every text/surface
  pair in both themes and fails below the minimum. Run it after any colour
  change; add a pair for every new combination.
- **Type:** Fraunces for display text and big numbers (SOFT axis 50), Plus
  Jakarta for body **and all buttons**. Sizes `text-display`,
  `text-headline`, `text-title`, `text-label`. No mono font, no
  `uppercase` anywhere.
- **Icons:** lucide only. **No emoji anywhere** in the UI (they look
  different on every phone). Big moments get `CelebrationOverlay`.
- **Motion:** CSS only (no Framer Motion). Easing tokens
  `--ease-out-expo` / `--ease-spring` / `--ease-in-quad`, durations
  `--dur-press|quick|base|slow`. New animations go inside the
  `prefers-reduced-motion: no-preference` block; a safety net at the end
  collapses everything else to its end state (spinners exempt).
- **Theme:** light / dark / system, default system, applied by an inline
  script before first paint (no flash).
- **Components:** shadcn/ui on `@base-ui/react`. `alert-dialog.tsx` for
  confirmations, `dialog.tsx` for plain popups, `sheet.tsx` for the cart
  and rating. Gotcha: put `disabled` on the `...Trigger` itself, not on the
  element in its `render` prop.
- **Every page has exactly one `<h1>`.**
- **Check every change** at 320 px, in light and dark.

---

## 12. Logo, icons and the startup splash

- Sources: `public/mutebites-logo-v2-2.png` (transparent; everything is
  generated from it) and `-v2-1.png` (reference).
  `node scripts/build-brand-assets.mjs` regenerates: `public/brand/mark.webp`
  / `mark.png` (mascot only), `src/app/favicon.ico` (16/32/48/64 **RGBA**
  frames — Next rejects non-RGBA), the splash layers in
  `public/brand/splash/` and their boxes in `src/components/splash/layers.ts`.
- `BrandLogo` always shows the mark on an ivory `#f5eae1` tile (the plum
  mascot vanishes on dark backgrounds).
- Install icons: `src/lib/app-icon.tsx` → `apple-icon.tsx`,
  `icons/icon-192`, `icon-512`, `icon-512-maskable` (mark at 0.6 scale for
  the safe circle). Manifest background is the same ivory.
- **Splash** (~2.5 s, once per browser session, never on `/admin`,
  `/auth`, `/privacy`, `/terms` or background tabs): the mascot runs in
  with jointed legs (`rig.ts`), 3 slowing strides, body bob, tray and lid
  bouncing, steam; feet plant and squash; swoosh draws, lid lifts, steam
  rises; wordmark and tagline; then the ivory screen shrinks into the
  page's own logo tile. Plain markup (`app-splash.tsx`), all motion in one
  self-contained function (`engine.ts`) inlined as a raw `<script>` (not
  `next/script`, which would let the app paint first). Reduced motion:
  fade in/out only. Safety valves: tap to skip, slow images just fade, CSS
  hides it after 9 s. `?intro` replays, `?nosplash` skips once,
  `NEXT_PUBLIC_DISABLE_SPLASH=1` removes it.

---

## 13. Notifications (web push)

- `public/sw.js` handles notifications only — **no fetch handler**, so it
  can never serve a stale page.
- `src/lib/notifications/client.ts` registers it, asks permission, saves
  the subscription; `send.ts` sends with `web-push` (30-min TTL, high
  urgency for admin) and deletes subscriptions reported gone (404/410).
- Students: confirmed, delivered, cancelled (sent through the admin's own
  session). Admin: new order (needs the service-role key because a
  student's session can't see the admin's devices).
- UI: Profile switch, one-time "Get a ping" card on a live order, admin
  bell that both grants permission and arms the loud alarm (browsers block
  sound until a tap). A notification's own sound is the phone's setting.

---

## 14. Performance

| Fix | Effect |
|---|---|
| `vercel.json` regions `["bom1"]` to sit next to Supabase `ap-south-1` | biggest win: stopped every call crossing Virginia↔Mumbai |
| Removed the second `auth.getUser()` per request (pages use `getSession()`) | one network round trip less per page |
| Start profile-independent queries at the same time as the profile lookup | Home 2.7 s → 1.0 s → **0.3 s** |
| Loading skeletons per page, view transitions | pages feel instant |
| Card slides load dish photos one slide ahead, only once seen | fewer image downloads |

---

## 15. SEO

Only `/login`, `/privacy` and `/terms` are public, so that's what Google
can see (menus stay private, by decision).
- `src/lib/site.ts`: site URL (`NEXT_PUBLIC_SITE_URL` overrides it), name,
  search title, description.
- Root layout: `metadataBase`, description, keywords, Open Graph / Twitter
  tags, Search Console verification from `GOOGLE_SITE_VERIFICATION`.
- `src/app/opengraph-image.tsx`: the link-preview card (mark, name,
  tagline, four dish photos with literal paths).
- `/login`: full search title, canonical link, Organization/WebSite
  structured data.
- `sitemap.ts` (3 pages), `robots.ts` (points to the sitemap, disallows
  `/admin`, `/auth`, `/orders`, `/profile`, `/welcome`); those pages are
  also marked noindex.

---

## 16. Security

- **Two-layer admin** (role + passcode), passcode only in env vars, fails
  closed.
- **Everything enforced in the database** (RLS, triggers,
  security-definer functions); the app's checks are only for friendly
  messages.
- Prices, totals, availability, schedule, bans and rate limits are all
  decided by `place_order()`.
- **Headers** (`next.config.ts`): `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`; HSTS
  comes from Vercel.
- **Content policy (CSP):** self + Supabase (REST and Realtime), inline
  scripts allowed (theme/splash/structured data are inline on purpose),
  **report-only** for now; violations go to `/api/csp-report` and show in
  Vercel logs as `[csp]`.
- `npm audit`: 0 vulnerabilities (22 Sep).
- Supabase sign-in rate limits; Google-only sign-in (no passwords to
  guess).

---

## 17. Restaurants, menus and photos

The menus are MuteBites data (in the seed migrations); a new university
needs its own. How photos work:
- `public/MuteBites/<restaurant folder>/<dish>.jpg` and
  `public/MuteBites/covers/<restaurant>.jpg`.
- Matched **by exact name** in `src/lib/data/dish-photos.ts`
  (`RESTAURANT_COVER_PHOTOS`, `DISH_PHOTOS`, `SIGNATURE_DISHES`) — not a
  database column, so adding a photo needs no SQL. No confident match →
  plain striped placeholder, never a wrong photo.
- **Replacing a photo: always use a new filename** (`-v2`). An outside
  cache kept serving old photos by URL.
- The sign-in mosaic (`MOSAIC` in `login/page.tsx`) and the share image
  reference photo paths directly; update them if a photo is renamed.
- Renaming a restaurant in the database means updating its keys in
  `dish-photos.ts` (folders can keep old names — Food Corner still uses
  `MuteBites Chinese/`).
- Photos with watermarks or a rival's logo were rejected; cover photos
  came from free-licence stock (Unsplash/Pexels) when the client had none.

Adding a restaurant (template: `20260922010000_seed_sugarcane_juice.sql`):
one migration inserting the restaurant, its sections and dishes (put the
`values` list first and join restaurant/section onto it), plus photo
entries in `dish-photos.ts`. Run it once.

---

## 18. Problems we hit and how we fixed them

| Problem | Cause | Fix / lesson |
|---|---|---|
| Email OTP wouldn't send | Resend needs a verified domain; Supabase's free mailer can't show a code | Switched to Google sign-in |
| Session code never ran | `middleware.ts` at repo root; this Next.js wants `src/proxy.ts` | Moved and renamed |
| No `/auth/callback` | never created | Added the route |
| `record "new" has no field "role"` | `role` renamed to `student` in the Table Editor | Renamed back in SQL; never rename in the editor |
| Paused switch didn't block orders | function part of a migration never ran (split SQL tabs) | Re-applied `place_order()`; run whole files |
| Re-running a fix migration errored | the fix was already applied by hand | Expected; migrations document history |
| Restaurant skeleton flashed on every page | `loading.tsx` at the app root applies to all routes | `(home)` route group |
| "use server" file broke | it exported a constant | Only async functions; constants in another module |
| Photos stayed old everywhere (even incognito) | an outside cache by URL | New filenames (`-v2`) |
| Pages took 2–3 s | functions in US-East, DB in Mumbai; double `getUser()` | `bom1` region, one auth check, parallel queries |
| Deploy stuck on "Initializing" | Vercel outage | Check vercel-status; don't pile up redeploys |
| Disabled button still clickable | Base UI trigger overrides `disabled` from `render` | Put `disabled` on the trigger |
| Mark all delivered "disappeared" | returned null with nothing eligible | Always render, disabled with a reason |
| Light flash in dark mode | theme script ran after paint (`next/script`) | Raw inline `<script>` in the layout |
| favicon build error | ICO frames weren't RGBA | Regenerate with alpha |
| Logo "PNG" was a JPEG | file extension wrong | Harmless for images; regenerate for icons |
| Install icons / manifest / service worker redirected to login | caught by the sign-in guard | Add to the proxy matcher's skip list |
| Profile cramped / clipped on some phones | long email without `min-w-0`; phone zoom settings | Fix row layout; phone-side zoom is the user's |
| "8:20 PM" split over two lines | narrow box | No-break spaces in the time |
| Late-night orders showed a past time | slots only covered the day | Schedule closes at 7 PM; forced-open late orders say "to be confirmed" |
| "Top 40%" confused students | percentile wording | Tier names |
| Dates printed "Sept" | en-IN/en-GB format | Build "Sep" from en-US parts |
| Trending showed test orders | test accounts ordered after launch too | Ban test accounts + launch date filter |
| Supabase "Run and enable RLS" prompt | shown on data inserts | Fine for existing tables; ask first for a new table |
| Claude's browser pane hidden | no layout, throttled timers | Verify by page structure; ask the user to test on the phone |

---

## 19. Still open

- **Switch the content policy from report-only to enforced** after a day
  of clean `[csp]` logs (one-line change in `next.config.ts`).
- **Raise Supabase's sign-in limit to ~100** (campus Wi-Fi).
- **Fully automated WhatsApp confirmation** (WhatsApp Business Cloud API +
  webhook that confirms on "yes"): waiting on the client for cost (~₹0.115
  + GST per message), giving up normal WhatsApp on the number, and
  template approval. Needs its own migration.
- **Harden the admin passcode cookie:** today it stores the passcode value
  itself; better to store a signed hash (HMAC) and compare in constant
  time. Do this from the start in the new project.
- Restaurant phone numbers are all MuteBites' support number; set real
  ones if the admin should call restaurants from the app.

---

## 20. Porting checklist: every university-specific thing

### Collect from the client first
University name and city/state; pickup point name (e.g. "Main Gate");
restaurants with sections, dishes, prices, veg/non-veg, notes; dish and
cover photos; ordering schedule and delivery windows; support phone
(call + WhatsApp); admin alert email; brand name, logo (transparent PNG),
colours, tagline; domain; which dish is the "free reward"; test accounts
to exclude from stats; launch date.

### Text and data to change
| Where | What |
|---|---|
| `src/lib/site.ts` | site URL, name, search title, description |
| `src/app/layout.tsx` | keywords |
| `src/app/login/page.tsx` | pitch line, `areaServed`, `MOSAIC` photos |
| `src/app/manifest.ts` | name, description, colours |
| `src/app/opengraph-image.tsx` | share text and photo paths |
| `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` | university, pickup point, contact |
| `src/components/home/about-mutebites-dialog.tsx` | about text |
| `src/components/home/restaurant-list.tsx` | "Free delivery to … Main Gate" |
| `src/components/home/home-header.tsx`, `thursday-nudge.tsx` | greeting, weekly special |
| `src/components/cart/cart-sheet.tsx` | pickup point |
| `src/components/orders/order-tracking.tsx` | "Collect at …" |
| `src/components/lost-ticket.tsx`, `empty-state.tsx` | brand line |
| `src/app/profile/page.tsx` | handover point |
| `src/app/welcome/welcome-form.tsx` | pickup point in the hint |
| `src/components/admin/stat-cards.tsx` | "· <pickup point>" |
| `src/lib/support.ts` | support phone |
| `src/lib/notifications/send.ts` | `ADMIN_ALERT_EMAILS` |
| `src/lib/data/dish-photos.ts` | all photo maps and signature dishes |
| `src/components/profile/milestone-badges.tsx` | reward wording and thresholds |
| `src/lib/orders/admin-text.ts` | WhatsApp greeting ("this is MuteBites") |
| `src/lib/date.ts`, `src/lib/ordering.ts` + SQL `ordering_schedule_open()` | schedule and windows (and time zone if not IST) |
| `src/lib/phone.ts` + `place_order()` regex | phone format (India +91 today) |
| `src/lib/format.ts` | currency (₹) |
| `src/app/globals.css` | colours, mood-field colours (re-run the contrast audit) |
| `public/…logo…`, `scripts/build-brand-assets.mjs` | logo and all generated icons, splash layers (re-measure the regions) |
| `src/components/splash/*` | splash (or disable with `NEXT_PUBLIC_DISABLE_SPLASH=1`) |
| `20260921020000_trending_skip_banned.sql` | launch date |
| seed migrations | new restaurants and menus |
| `vercel.json` | region matching the new Supabase |
| CLAUDE.md | every mention of VIT-AP, MuteBites, numbers, restaurants |

Search tip: `grep -rn "VIT-AP\|Main Gate\|Amaravati\|MuteBites\|8247075652" src`.

---

## 21. Environment variables

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Vercel | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | local + Vercel (secret) | admin push only; missing = no admin push |
| `ADMIN_PASSCODE` | local + Vercel (secret) | second admin layer; unset = nobody gets in |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | local + Vercel | web push public key |
| `VAPID_PRIVATE_KEY` | local + Vercel (secret) | web push private key |
| `GOOGLE_SITE_VERIFICATION` | Vercel | Search Console token (public) |
| `NEXT_PUBLIC_SITE_URL` | optional | overrides the site URL (custom domain) |
| `NEXT_PUBLIC_DISABLE_SPLASH` | optional | `1` removes the splash |

`.env.local` is gitignored. Never commit a secret, never paste one into
chat.

---

## 22. Starter prompt for the new project

```
I'm building <APP NAME>, a food ordering site for <UNIVERSITY> students,
by adapting an app I already built (MuteBites, for VIT-AP). The repo is a
copy of MuteBites. Read CLAUDE.md, AGENTS.md and docs/MUTEBITES-BLUEPRINT.md
first — the blueprint explains every feature, rule and setup step, and
section 20 lists everything that's university-specific.

Stack: Next.js 16 (customised — check node_modules/next/dist/docs before
using any API you're unsure of), React 19, Tailwind v4, shadcn/ui on
Base UI, Supabase, Vercel.

Rules, same as MuteBites:
- Never change the database without showing me the SQL first.
- One step at a time: build, check it yourself (build, lint,
  npm run audit:contrast, light + dark, 320px), tell me what to test,
  wait for "go".
- Commit and push to main after each step; check on the live site, not
  localhost.
- Cash on delivery only, no payment code. Google sign-in only.

New project facts:
- University: <name, city>
- Pickup point: <name>
- Support phone: <number>, admin alert email: <email>
- Brand: <name, tagline, colours>, logo at <path>
- Schedule: <ordering windows and delivery times>
- Restaurants and menus: <attached>
- Supabase region: <region>; live URL: <url>; repo: <url>

Step 1: walk me through section 5 (setup) for the new Supabase, Google
Cloud and Vercel projects, then give me the database migrations to run,
in order, without the MuteBites menu data.
```

---

## Appendix A: all 114 commits

```
09-15 04:07 Initial commit from Create Next App
09-15 17:56 Build student app: auth, menu, cart, ordering, tracking, profile
09-15 17:58 Clear the cart on sign-out
09-15 21:14 Add admin dashboard: dashboard, orders, ordering kill switch, bans
09-15 21:16 Fix paused-vs-closed dish label; resolve email-domain TODO
09-15 21:41 Add admin passcode gate, order filters, and cancel order
09-15 23:38 Veg filter, dish search, loading skeletons, live order tracking
09-15 23:52 Label the current tracking step "(pending)"
09-15 23:55 Document the (home) route group and loading.tsx locations
09-16 15:36 Add UI/UX polish pass and two new restaurants with real photography
09-16 16:46 Add sequential daily order numbers; admin today/history split; Home cleanup
09-16 18:32 Add profile gamification, orders page polish, and trending dishes leaderboard
09-16 18:51 Admin: separate banned-users page, button styling; orders/home polish
09-16 19:11 Add ordering streak, favorite dish tags, milestone toasts, and UX polish
09-16 19:23 Add weekly rank badge; fix duplicate search-clear icon and Live dot size
09-16 19:41 Drop unused trending_restaurants() function
09-16 22:03 Add privacy/terms pages; fix profile email-row overflow and spacing
09-17 13:15 Profile page overhaul: loading skeleton, support card, header/milestone rework
09-17 18:48 Fix slow page loads: stop double-verifying auth on every request
09-17 18:53 Pin Vercel function region to bom1 (Mumbai) to match Supabase
09-17 22:00 Parallelize profile-independent queries on Home, Profile, and menu pages
09-17 22:09 Show "Glad to have you back!" toast on re-sign-in
09-17 22:13 Default theme to system preference instead of always-light
09-17 22:40 Add "Highly re-ordered" dish tag
09-18 00:00 Admin: reload button, side-by-side Confirm/Cancel, always-visible bulk action
09-18 00:05 Admin: hide Cancel once an order is confirmed
09-18 00:16 Add UPI line to checkout; unify order-tracking's support button with profile's
09-18 00:23 Fix icon/text alignment in checkout notice; de-dupe home banner
09-18 00:29 Replace weekly-rank percentile with tiered labels
09-18 00:31 Update CLAUDE.md: weekly-rank badge now shows tiers, not a raw percentile
09-18 00:38 Remind students to use their WhatsApp number in checkout
09-18 00:52 Document pending WhatsApp auto-confirm feature (client sign-off needed)
09-18 01:14 Use real MuteBites logo for favicon and PWA install icons
09-18 01:31 Add admin Users page; move Banned users a level deeper
09-18 01:36 Style the Ban search-result action as a button, not a text link
09-18 13:41 Remind students to use their WhatsApp number on first-login signup
09-18 19:50 Merge WhatsApp reminder into the same phone hint line, not below it
09-18 23:16 Design step 1: plum/amber/rose token system with real surface hierarchy
09-18 23:19 Document design token rules in CLAUDE.md
09-18 23:23 Give ink surfaces their own readable accent tokens
09-18 23:34 Design step 2: Fraunces display face, named type scale, no mono eyebrows
09-18 23:42 Design step 3: photo-mosaic login screen
09-18 23:44 Login: let the photo mosaic absorb spare height instead of a gap
09-18 23:47 Login: fluid display size and smaller mosaic floor for 320px phones
09-18 23:49 Note the login mosaic's direct photo paths in CLAUDE.md
09-18 23:56 Design step 4: Home header as a time-of-day ambient field with a hero heading
09-19 00:01 Home header: fuller mood field (top-down wash + two broad light sources)
09-19 00:02 Document the Home header mood field in CLAUDE.md
09-19 00:08 Design step 5: photo-collage restaurant card
09-19 00:13 Keep the handover strip to one line on phones
09-19 00:15 Restaurant card: cuisines on their own rose line, stats kept to one line
09-19 00:16 Restaurant card: let long cuisine lists wrap instead of truncating
09-19 00:24 Design step 6: photo-grid menu, corner add control, one sticky filter row
09-19 00:42 Design step 7: photo cart bar, and a cart sheet that stops clipping
09-19 00:46 Cart line: let the stepper row wrap on 320px phones
09-19 00:52 Design step 8: order tracking as a photo ticket stub
09-19 01:00 Design step 9: orders list grouped by day, with photos and plain dish text
09-19 01:08 Design step 10: plum member card, six milestones with locked goals, labelled sign-out
09-19 01:10 Member card: top-align the stats so a wrapped label doesn't lift its number
09-19 01:16 Design step 11: branded 404 and error pages, photo empty states
09-19 01:19 Treat malformed ids as 404s; give the error page a tab title
09-19 01:22 Menu page: 404 a malformed restaurant id before any lookup runs
09-19 01:29 Design step 12: photo Trending popup with deep links, emoji → lucide
09-19 01:32 Deep link: scroll after the page transition; Trending counts in their own column
09-19 01:42 Design step 13: motion tokens, reduced-motion safety net, purposeful touches
09-19 02:37 Design step 14: admin panel on the same design system as the student app
09-19 03:17 Admin: stop restaurant cards overflowing a 375px screen; fix CLAUDE.md backticks
09-19 03:18 Admin: same shrinkable grid column for order cards (were 383px on a 375px screen)
09-19 09:18 Step 15 QA: contrast fixes from a full token-pair audit, plus the audit itself
09-19 09:38 Step 15 QA: headings, robots.txt, login LCP, menu skeleton at 320px
09-19 09:41 Document robots.ts and the one-h1-per-page rule in CLAUDE.md
09-19 10:07 Fix admin "Mark all delivered": really disable it, count every confirmed order
09-19 10:33 Daily ordering schedule with a three-way admin override
09-19 11:25 Stop writing the legacy ordering_enabled column; add migration to drop it
09-19 11:43 Home search finds dishes, not just restaurants
09-19 12:52 Ratings step 1: order_reviews / order_item_ratings schema (applied in Supabase)
09-19 13:06 Privacy policy: say how ratings and notes are stored and who sees them
09-19 13:14 Ratings step 2: rate a delivered order (stars per dish + optional note)
09-19 13:36 Ratings step 3: Rate pill in Orders, one-time Home pop-up, ?rate=1
09-19 13:40 Ratings step 4: admin Reviews page
09-19 13:52 Docs: bring CLAUDE.md up to date, replace boilerplate README
09-19 13:58 Celebrate milestone unlocks with the order-placed overlay
09-19 14:02 Order tracking: say "Pending confirmation" until the order is confirmed
09-19 14:12 Home: restaurant cards auto-slide from the cover through dish photos
09-19 14:23 Restaurant card slides: hold the cover longer, tap a dish to open it
09-19 14:31 Restaurant card slides: lead with each restaurant's most-ordered dishes
09-19 14:54 Remove Bismillah's catch-all juice items
09-19 17:26 Photos for Kaju Paneer Butter Masala and Double Egg Chicken Noodles
09-19 21:45 New logo everywhere + startup splash animation
09-19 22:09 Apply the saved theme before first paint (no light flash in dark mode)
09-19 23:02 Splash v2: the mascot really runs, and lands in the app's logo
09-20 00:08 Menu: Veg / Non-veg filter; photos keyed to "Food Corner"
09-20 00:54 Record the Food Corner rename; drop the old-name photo alias
09-20 01:16 New Mixed Biryani photo (Bheemasena); record mushroom biryani price
09-20 01:19 Record the mixed biryani note migration
09-20 01:26 New photo for A1's Mixed Biryani
09-20 14:56 Photos for Bheemasena's Mutton Afghani and Prawn biryanis
09-20 14:58 Record the two new Bheemasena biryanis
09-20 22:41 Photos for 16 new Bheemasena dishes
09-20 22:45 Record the 16 new Bheemasena dishes
09-20 22:48 Mutton Mughlai Biryani: cropped photo under a new filename
09-21 00:09 Admin: Sold out page for per-dish availability
09-21 00:37 Order notifications (web push) for students and the admin
09-21 00:39 Let the service worker through the sign-in guard
09-21 00:46 Record the push_subscriptions table
09-21 09:04 Profile: free-biryani reward for completing every milestone
09-21 09:19 Track free-biryani milestone reward claims
09-21 10:16 Admin: current orders only, clearer order cards and WhatsApp text, total close
09-21 11:09 Admin: order details page, name and number on the card's order box, shorter copy text
09-21 12:37 Trending: skip pre-launch orders and banned phone numbers
09-21 14:36 SEO basics: page details, share image, sitemap, robots and noindex
09-21 15:31 Security headers (CSP report-only) and a CSP violation log endpoint
09-22 08:17 Rate-limit place_order(): 5 a minute, 8 unfinished, with clear messages
09-22 08:42 Add MuteBites Sugarcane Juice (migration + photos)
```

---

## Appendix B: all 35 migrations

"New project" says whether to run it when rebuilding elsewhere:
**Run** (structure), **Skip** (MuteBites data or a one-off fix), or
**Replace** (write your own version).

| # | File | What | New project |
|---|---|---|---|
| 1 | `20260915000000_init_schema.sql` | 6 tables, RLS | Run |
| 2 | `20260915010000_add_user_role.sql` | role, `is_admin()`, admin policies, escalation trigger | Run |
| 3 | `20260915020000_google_oauth_and_ban.sql` | phone/is_banned, ban check, trigger guards is_banned | Run |
| 4 | `20260915030000_ban_by_phone.sql` | drop phone unique, ban by phone | Run |
| 5 | `20260915040000_drop_block_and_room.sql` | drop hostel block/room | Run |
| 6 | `20260915050000_place_order_function.sql` | `place_order()`, remove student inserts | Run |
| 7 | `20260915060000_seed_restaurants.sql` | 3 MuteBites restaurants + menus | **Replace** |
| 8 | `20260915070000_guard_phone_changes.sql` | trigger guards phone | Run |
| 9 | `20260915080000_admin_dashboard.sql` | admin read orders, `app_settings`, paused check | Run |
| 10 | `20260915090000_fix_users_role_column_rename.sql` | undo accidental rename | **Skip** (errors on a fresh DB) |
| 11 | `20260915100000_admin_users_and_ban.sql` | admin read users/items, admin ban | Run |
| 12 | `20260915110000_reapply_place_order_ordering_check.sql` | re-apply `place_order()` | Run (harmless) or skip |
| 13 | `20260915120000_banned_at.sql` | `banned_at` + trigger | Run |
| 14 | `20260915130000_enable_realtime_orders.sql` | orders in Realtime | Run |
| 15 | `20260915140000_seed_new_restaurants.sql` | MuteBites Chinese + Fresh Fruits | **Replace** |
| 16 | `20260915150000_daily_order_numbers.sql` | token counter + trigger | Run |
| 17 | `20260916000000_trending_leaderboard.sql` | `trending_dishes()` (+ one later dropped) | Run |
| 18 | `20260917000000_my_weekly_rank.sql` | `my_weekly_rank()` | Run |
| 19 | `20260917010000_drop_unused_trending_restaurants.sql` | drop unused function | Run |
| 20 | `20260917020000_highly_reordered_dishes.sql` | `highly_reordered_dishes()` | Run |
| 21 | `20260919000000_ordering_schedule.sql` | schedule + Auto/Open/Closed | Run (**edit times**) |
| 22 | `20260919010000_drop_ordering_enabled.sql` | drop the old switch | Run |
| 23 | `20260919020000_order_reviews.sql` | ratings tables, `submit_review()`, `delivered_at` | Run |
| 24 | `20260919030000_remove_bismillah_catch_all_juices.sql` | menu data | **Skip** |
| 25 | `20260919040000_fix_banana_pack_and_bismillah_tags.sql` | menu data | **Skip** |
| 26 | `20260920000000_rename_chinese_to_food_corner.sql` | menu data | **Skip** |
| 27 | `20260920010000_bheemasena_single_mushroom_price.sql` | menu data | **Skip** |
| 28 | `20260920020000_mixed_biryani_note.sql` | menu data | **Skip** |
| 29 | `20260920030000_bheemasena_mutton_prawn_biryani.sql` | menu data | **Skip** |
| 30 | `20260920040000_bheemasena_new_dishes.sql` | menu data | **Skip** |
| 31 | `20260921000000_push_subscriptions.sql` | push subscriptions | Run |
| 32 | `20260921010000_milestone_rewards.sql` | reward claims | Run |
| 33 | `20260921020000_trending_skip_banned.sql` | trending skips pre-launch + banned | Run (**edit launch date**) |
| 34 | `20260922000000_place_order_rate_limit.sql` | final `place_order()` with rate limits | Run |
| 35 | `20260922010000_seed_sugarcane_juice.sql` | sixth restaurant | **Replace** (good template) |

Run them in this order; each one assumes the ones before it. After #34,
`place_order()` is in its final form, so the earlier versions (#6, #9, #12,
#21) only matter as steps along the way.
