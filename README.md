# College Bites

Crave. Click. Campus. Food ordering for SRM University AP students — browse
partner restaurants, order, and collect at Gate 3. Cash (or UPI) on pickup; no online
payments.

Live: https://collegebitessrm.vercel.app

Project overview, setup and history: [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md).
Running the app day to day: [`docs/CLIENT-GUIDE.md`](docs/CLIENT-GUIDE.md).

**Detailed project notes — design system, database schema, admin access,
the ordering switch, ratings and every non-obvious decision — live in
[`CLAUDE.md`](CLAUDE.md). Read that before changing anything.**

## Stack

- Next.js 16 (App Router) + React 19, TypeScript — a customised Next.js; see
  [`AGENTS.md`](AGENTS.md) and `node_modules/next/dist/docs/` for its APIs.
- Tailwind CSS v4 + shadcn/ui (Base UI) components.
- Supabase: Postgres with Row Level Security, Google sign-in via Supabase Auth,
  Realtime for live order status.
- Hosted on Vercel (functions pinned to `bom1`, next to Supabase's
  `ap-south-1`).

## Setup

```bash
npm install
```

Create `.env.local` with:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used only to send the admin's new-order push |
| `ADMIN_PASSCODE` | Second gate for `/admin` — no value means nobody gets in |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push keys (`npx web-push generate-vapid-keys`) |

The same variables are set in the Vercel project for production.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npm run audit:contrast` | Checks every text/surface colour pair in both themes against WCAG; fails on any miss |

## Database

Migrations are hand-written SQL in `supabase/migrations/`, applied through the
Supabase connector after the SQL has been reviewed and approved. The folder
holds exactly what the database has. Never edit one that's already applied —
add a new timestamped file.

## Deploying

Pushing to `main` deploys to production on Vercel automatically. Commits must
be authored by `collegebitessrm <collegebitessrm@gmail.com>` (set in this
repo's git config) — Vercel's Hobby plan won't build anyone else's commits.
