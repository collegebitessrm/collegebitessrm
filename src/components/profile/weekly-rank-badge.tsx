import { Flame, Sparkle, Trophy, type LucideIcon } from "lucide-react";
import type { WeeklyRank } from "@/lib/data/rank";

const MIN_PARTICIPANTS = 5;

// Tiers instead of a raw percentile — "Top 40%" reads as ambiguous
// stats-speak (students kept asking what it meant); a label needs no
// interpreting. Checked in order, first match wins.
const TIERS: { maxPercentile: number; label: string; Icon: LucideIcon }[] = [
  { maxPercentile: 10, label: "Top orderer this week", Icon: Trophy },
  { maxPercentile: 25, label: "Frequent orderer this week", Icon: Flame },
  { maxPercentile: 50, label: "Active orderer this week", Icon: Sparkle },
];

/**
 * Tiered version of the weekly rank — only shown when it's flattering
 * (top half or better) and the participating pool is big enough that the
 * underlying percentile actually means something. Rendered as a pill on
 * the profile's plum member card, so it uses the ink-surface tokens.
 */
export function WeeklyRankBadge({ rank }: { rank: WeeklyRank | null }) {
  if (!rank || rank.totalStudents < MIN_PARTICIPANTS) return null;

  const tier = TIERS.find((t) => rank.percentile <= t.maxPercentile);
  if (!tier) return null;

  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1 text-sm font-semibold">
      <tier.Icon className="size-4 text-ink-accent" aria-hidden="true" />
      {tier.label}
    </p>
  );
}
