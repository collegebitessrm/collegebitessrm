import type { CSSProperties } from "react";

/**
 * "You've tried N of M at {restaurant}" on the menu page, with a thin
 * sunset bar that fills in from empty the first time it paints (instant
 * under reduced motion) and a note of how many are left.
 */
export function MenuProgress({
  restaurantName,
  tried,
  total,
}: {
  restaurantName: string;
  tried: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.min(100, Math.round((tried / total) * 100));
  const left = Math.max(0, total - tried);

  return (
    <div className="mt-4">
      <p className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
        <span>
          You&apos;ve tried <span className="font-semibold text-foreground">{tried}</span> of {total} here
        </span>
        <span className="shrink-0 text-xs">{left === 0 ? "Tried it all" : `${left} to go`}</span>
      </p>
      <div
        role="progressbar"
        aria-valuenow={tried}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Dishes tried at ${restaurantName}`}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="progress-fill h-full w-(--fill) rounded-full bg-[linear-gradient(90deg,var(--hero-a),var(--hero-b),var(--hero-c))] shadow-[0_0_10px_var(--glow-sun)]"
          style={{ "--fill": `${pct}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}
