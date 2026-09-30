import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The profile's one sunset hero block: who you are and how you order, in a
 * single card instead of an avatar tile, a cravings line, a streak chip, a
 * rank banner and a pickups card each stacked as its own box.
 * Numbers use the display face; the no-show count turns hero-danger once it
 * isn't zero, since that's the stat the ban system actually cares about.
 */
export function MemberCard({
  initials,
  name,
  memberSince,
  rankBadge,
  cravingsSolved,
  streakDays,
  noShows,
}: {
  initials: string;
  name: string;
  memberSince: string;
  /** <WeeklyRankBadge/>, which renders nothing when it has nothing flattering to say. */
  rankBadge: ReactNode;
  cravingsSolved: number;
  streakDays: number;
  noShows: number;
}) {
  return (
    <section className="surface-hero glow-sun rounded-3xl bg-hero p-5 text-hero-foreground">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-hero-foreground/10 font-heading text-2xl font-bold text-hero-accent">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-title font-bold">{name}</h1>
          <p className="text-sm text-hero-foreground/85">Member since {memberSince}</p>
        </div>
      </div>

      <div className="mt-4 empty:hidden">{rankBadge}</div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-hero-foreground/15 border-t border-hero-foreground/15 pt-4 text-center">
        <Stat value={cravingsSolved} label={cravingsSolved === 1 ? "craving solved" : "cravings solved"} />
        <Stat value={streakDays} label="day streak" />
        <Stat value={noShows} label={noShows === 1 ? "no-show" : "no-shows"} danger={noShows > 0} />
      </dl>
    </section>
  );
}

function Stat({ value, label, danger = false }: { value: number; label: string; danger?: boolean }) {
  return (
    <div className="flex flex-col-reverse justify-end px-1">
      <dt className="text-xs text-hero-foreground/85">{label}</dt>
      <dd className={cn("font-heading text-2xl font-bold tabular-nums", danger && "text-hero-danger")}>{value}</dd>
    </div>
  );
}
