import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The profile's one dark, plum block: who you are and how you order, in a
 * single card instead of an avatar tile, a cravings line, a streak chip, a
 * rank banner and a pickups card each stacked as its own amber/blush box.
 * Numbers use the display face; the no-show count turns ink-danger once it
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
    <section className="surface-ink shadow-elevated-glow rounded-3xl bg-ink p-5 text-ink-foreground">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-ink-foreground/10 font-heading text-2xl font-bold text-ink-accent">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-title font-bold">{name}</h1>
          <p className="text-sm text-ink-foreground/75">Member since {memberSince}</p>
        </div>
      </div>

      <div className="mt-4 empty:hidden">{rankBadge}</div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-ink-foreground/15 border-t border-ink-foreground/15 pt-4 text-center">
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
      <dt className="text-xs text-ink-foreground/75">{label}</dt>
      <dd className={cn("font-heading text-2xl font-bold tabular-nums", danger && "text-ink-danger")}>{value}</dd>
    </div>
  );
}
