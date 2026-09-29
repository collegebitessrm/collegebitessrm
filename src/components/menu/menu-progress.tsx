/** Thin "You've tried N of M at {restaurant}" progress bar on the menu page. */
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

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        You&apos;ve tried <span className="font-semibold text-foreground">{tried}</span> of {total} at{" "}
        {restaurantName}
      </p>
      <div
        role="progressbar"
        aria-valuenow={tried}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Dishes tried at ${restaurantName}`}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
