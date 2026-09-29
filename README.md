# MuteBites

Food ordering for VIT-AP University students — browse partner restaurants,
order, and collect at VIT-AP Main Gate. Cash (or UPI) on pickup; no online
payments.

Live: https://mutebites.vercel.app

**Detailed project notes — design system, database schema, admin access,
the ordering schedule, ratings and every non-obvious decision — live in
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
| `ADMIN_PASSCODE` | Second gate for `/admin` — no value means nobody gets in |

The same variables are set in the Vercel project for production.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npm run audit:contrast` | Checks every text/surface colour pair in both themes against WCAG; fails on any miss |

## Database

Migrations are hand-written SQL in `supabase/migrations/`, applied by hand in
the Supabase SQL editor (no CLI). Never edit one that's already applied — add
a new timestamped file. Schema changes get reviewed as SQL before they're run.

## Deploying

Pushing to `main` deploys to production on Vercel automatically.
