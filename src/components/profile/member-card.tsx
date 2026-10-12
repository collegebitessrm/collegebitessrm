import type { ReactNode } from "react";
import { Avatar } from "@/components/taste/avatar";
import { OpenTasteSheetButton } from "@/components/taste/taste-sheet";
import { cn } from "@/lib/utils";

/*
 * The profile's campus pass: a clean card holding who you are and
 * how you order — the student's avatar (tapping it opens "Your taste"),
 * name and member-since, the weekly-rank pill, and three stat tiles.
 * Numbers use the display face; the no-show count turns red once it
 * isn't zero, since that's the stat the ban system actually cares about.
 */
export function MemberCard({
  avatar,
  name,
  memberSince,
  rankBadge,
  cravingsSolved,
  streakDays,
  noShows,
}: {
  /** The taste profile's avatar id. */
  avatar: string;
  name: string;
  memberSince: string;
  /** <WeeklyRankBadge/>, which renders nothing when it has nothing flattering to say. */
  rankBadge: ReactNode;
  cravingsSolved: number;
  streakDays: number;
  noShows: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border bg-card p-5 shadow-card">
      <p className="text-xs font-semibold text-muted-foreground">College Bites · campus pass</p>

      <div className="mt-3 flex items-center gap-4">
        <OpenTasteSheetButton
          aria-label="Change your avatar"
          className="pressable relative flex size-[4.5rem] shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <Avatar id={avatar} tone="primary" className="relative size-[3.9rem]" />
        </OpenTasteSheetButton>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-title font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
        </div>
      </div>

      <div className="mt-4 empty:hidden">{rankBadge}</div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat value={cravingsSolved} label={cravingsSolved === 1 ? "craving solved" : "cravings solved"} delay={0} />
        <Stat value={streakDays} label="day streak" delay={60} />
        <Stat value={noShows} label={noShows === 1 ? "no-show" : "no-shows"} danger={noShows > 0} delay={120} />
      </dl>
    </section>
  );
}

function Stat({ value, label, danger = false, delay }: { value: number; label: string; danger?: boolean; delay: number }) {
  return (
    <div
      className="animate-pop-in flex flex-col-reverse justify-end rounded-2xl bg-secondary px-1 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <dt className="text-xs leading-tight font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("font-heading text-3xl leading-none font-bold tabular-nums", danger ? "text-destructive" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}